import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  CRON_TASKS,
  RemittanceDatabaseRepository,
  RemittanceEventKafkaEmitter,
  ExchangeQuotationEventKafkaEmitter,
  RemittanceExchangeQuotationDatabaseRepository,
  ExchangeQuotationDatabaseRepository,
} from '@zro/otc/infrastructure';
import { SyncStateExchangeQuotationController } from '@zro/otc/interface';
import {
  TopazioGatewayConfig,
  TopazioAxiosService,
  TopazioExchangeQuotationService,
} from '@zro/topazio';

interface SyncExchangeQuotationCronConfig {
  APP_SYNC_STATE_EXCHANGE_QUOTATION_CRON: string;

  APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_KEY: string;
  APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncStateExchangeQuotationCronService implements OnModuleInit {
  /**
   * Envs for cron settings
   */
  private syncStateExchangeQuotationRedisKey: string;
  private syncStateExchangeQuotationRedisLockTimeout: number;
  private syncStateExchangeQuotationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      SyncExchangeQuotationCronConfig & TopazioGatewayConfig
    >,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: SyncStateExchangeQuotationCronService.name,
    });
  }

  onModuleInit() {
    const appSyncStateExchangeQuotationCron = this.configService.get<string>(
      'APP_SYNC_STATE_EXCHANGE_QUOTATION_CRON',
    );

    //Cron redis settings
    this.syncStateExchangeQuotationRedisKey = this.configService.get<string>(
      'APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_KEY',
    );
    this.syncStateExchangeQuotationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncStateExchangeQuotationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appSyncStateExchangeQuotationCron ||
      !this.syncStateExchangeQuotationRedisKey ||
      !this.syncStateExchangeQuotationRedisLockTimeout ||
      !this.syncStateExchangeQuotationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appSyncStateExchangeQuotationCron
          ? ['APP_SYNC_STATE_EXCHANGE_QUOTATION_CRON']
          : []),
        ...(!this.syncStateExchangeQuotationRedisKey
          ? ['APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_KEY']
          : []),
        ...(!this.syncStateExchangeQuotationRedisLockTimeout
          ? ['APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncStateExchangeQuotationRedisRefreshInterval
          ? ['APP_SYNC_STATE_EXCHANGE_QUOTATION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const stateExchangeQuotationSync = new CronJob(
      appSyncStateExchangeQuotationCron,
      () => this.syncStateExchangeQuotation(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.EXCHANGE_QUOTATION.SYNC_STATE,
      stateExchangeQuotationSync,
    );

    stateExchangeQuotationSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncStateExchangeQuotation(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncStateExchangeQuotationRedisKey,
      this.syncStateExchangeQuotationRedisLockTimeout,
      this.syncStateExchangeQuotationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const exchangeQuotationRepository =
            new ExchangeQuotationDatabaseRepository();
          const remittanceRepository = new RemittanceDatabaseRepository();
          const remittanceExchangeQuotationRepository =
            new RemittanceExchangeQuotationDatabaseRepository();

          if (!this.kafkaService) {
            logger.error('Missing kafkaService');
            return;
          }

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const remittanceEventEmitter = new RemittanceEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );
          const exchangeQuotationEventEmitter =
            new ExchangeQuotationEventKafkaEmitter(requestId, emitter, logger);

          const topazioAxios = new TopazioAxiosService(this.configService);
          const topazioService = new TopazioExchangeQuotationService(
            this.configService,
            topazioAxios,
            logger,
          );
          const topazioExchangeQuotationGateway =
            topazioService.getExchangeQuotationGateway(logger);

          logger.debug('Sync state exchange quotation started.');

          const controller = new SyncStateExchangeQuotationController(
            logger,
            topazioExchangeQuotationGateway,
            exchangeQuotationRepository,
            remittanceRepository,
            remittanceExchangeQuotationRepository,
            remittanceEventEmitter,
            exchangeQuotationEventEmitter,
          );

          await controller.execute();

          // Fire events.
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync state exchange quotation.', {
            error,
          });
        }
      },
    );
  }
}
