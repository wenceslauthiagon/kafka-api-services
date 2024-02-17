import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  InjectSequelize,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
  getMoment,
} from '@zro/common';
import {
  CRON_TASKS,
  BotOtcOrderDatabaseRepository,
  BotOtcDatabaseRepository,
  BotOtcOrderEventKafkaEmitter,
} from '@zro/otc-bot/infrastructure';
import { BotOtcOrderState } from '@zro/otc-bot/domain';
import { Sequelize } from 'sequelize';
import { HandlePendingBotOtcOrderController } from '@zro/otc-bot/interface';
import { CryptoRemittanceGateway } from '@zro/otc/application';
import { B2C2CryptoRemittanceService } from '@zro/b2c2';
import { BinanceCryptoRemittanceService } from '@zro/binance';

export interface BotOtcOrderCronConfig {
  APP_ENV: string;
  APP_BOT_OTC_ORDER_PENDING_CONTROL_INTERVAL_MS: number;
  APP_BOT_OTC_ORDER_PENDING_TIMEOUT_MS: number;

  APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_KEY: string;
  APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class BotOtcOrderPendingCronService
  implements OnModuleInit, OnModuleDestroy
{
  private cryptoRemittanceGateways: CryptoRemittanceGateway[] = [];
  private botOtcOrderPendingTimeout = 0;

  /**
   * Envs for cron settings
   */
  private syncBotOrderPendingRedisKey: string;
  private syncBotOrderPendingRedisLockTimeout: number;
  private syncBotOrderPendingRedisRefreshInterval: number;

  /**
   *
   * @param logger
   * @param schedulerRegistry
   * @param configService
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<BotOtcOrderCronConfig>,
    @InjectSequelize() private readonly sequelize: Sequelize,
    private readonly kafkaService: KafkaService,
    private readonly b2C2CryptoRemittanceService: B2C2CryptoRemittanceService,
    private readonly binanceCryptoRemittanceService: BinanceCryptoRemittanceService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: BotOtcOrderPendingCronService.name });
  }

  /**
   * Initialize bot control.
   */
  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.cryptoRemittanceGateways = [
      this.b2C2CryptoRemittanceService.getB2C2CryptoRemittanceGateway(
        this.logger,
      ),
      this.binanceCryptoRemittanceService.getBinanceCryptoRemittanceGateway(
        this.logger,
      ),
    ];

    this.botOtcOrderPendingTimeout = this.configService.get<number>(
      'APP_BOT_OTC_ORDER_PENDING_TIMEOUT_MS',
      10000,
    );

    // Time to update running bot status.
    const appBotOtcControlInterval = this.configService.get<number>(
      'APP_BOT_OTC_ORDER_PENDING_CONTROL_INTERVAL_MS',
      10000,
    );

    //Cron redis settings
    this.syncBotOrderPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_KEY',
    );
    this.syncBotOrderPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncBotOrderPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncBotOrderPendingRedisKey ||
      !this.syncBotOrderPendingRedisLockTimeout ||
      !this.syncBotOrderPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncBotOrderPendingRedisKey
          ? ['APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncBotOrderPendingRedisLockTimeout
          ? ['APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBotOrderPendingRedisRefreshInterval
          ? ['APP_SYNC_BOT_OTC_ORDER_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const interval = setInterval(async () => {
      await this.execute();
    }, appBotOtcControlInterval);

    this.schedulerRegistry.addInterval(
      CRON_TASKS.BOT_OTC_ORDER_PENDING_CONTROL,
      interval,
    );
  }

  /**
   * Shutdown quotation service.
   */
  async onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    // Delete interval
    this.schedulerRegistry.deleteInterval(
      CRON_TASKS.BOT_OTC_ORDER_PENDING_CONTROL,
    );
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async execute(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncBotOrderPendingRedisKey,
      this.syncBotOrderPendingRedisLockTimeout,
      this.syncBotOrderPendingRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        const transaction = await this.sequelize.transaction();

        try {
          const botOtcRepository = new BotOtcDatabaseRepository(transaction);

          const botOtcOrderRepository = new BotOtcOrderDatabaseRepository(
            transaction,
          );

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const botOtcOrderEventEmitter = new BotOtcOrderEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const controller = new HandlePendingBotOtcOrderController(
            logger,
            botOtcRepository,
            botOtcOrderRepository,
            botOtcOrderEventEmitter,
            this.cryptoRemittanceGateways,
          );

          const createdThreshold = getMoment()
            .subtract(this.botOtcOrderPendingTimeout, 'milliseconds')
            .toDate();

          const foundOrders =
            await botOtcOrderRepository.getAllByStateInAndCreatedAtBefore(
              [BotOtcOrderState.PENDING],
              createdThreshold,
            );

          await Promise.all(
            foundOrders.map(async (botOrder) => {
              try {
                await controller.execute({ id: botOrder.id });
              } catch (error) {
                botOrder.state = BotOtcOrderState.ERROR;
                botOrder.failedCode = error.code ?? 'UNEXPECTED_BOT_ERROR';
                // FIXME: Colocar a tradução utilizando o código do error.
                botOrder.failedMessage = error.message;
                logger.error('Bot failed', { error });

                await botOtcOrderRepository.update(botOrder);
              }
            }),
          );

          await transaction.commit();

          await emitter.fireEvents();
        } catch (error) {
          await transaction.rollback();
          logger.error('Handle bot order pending failed', {
            errorMessage: error.message,
            stack: error.stack,
          });
        }
      },
    );
  }
}
