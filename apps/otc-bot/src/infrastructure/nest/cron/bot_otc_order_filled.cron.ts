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
  BotOtcOrderEventKafkaEmitter,
  CRON_TASKS,
  BotOtcOrderDatabaseRepository,
  OtcServiceKafka,
} from '@zro/otc-bot/infrastructure';
import { HandleFilledBotOtcOrderController } from '@zro/otc-bot/interface';

export interface OpenRemittanceCronConfig {
  APP_SYNC_BOT_OTC_ORDER_FILLED_CRON: string;
  APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_KEY: string;
  APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncBotOtcOrderFilledCronService implements OnModuleInit {
  /**
   * Envs for cron settings
   */
  private syncBotOtcOrderFilledRedisKey: string;
  private syncBotOtcOrderFilledRedisLockTimeout: number;
  private syncBotOtcOrderFilledRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<OpenRemittanceCronConfig>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: SyncBotOtcOrderFilledCronService.name,
    });
  }

  onModuleInit() {
    const appSyncBotOtcOrderFilledCron = this.configService.get<string>(
      'APP_SYNC_BOT_OTC_ORDER_FILLED_CRON',
    );

    //Cron redis settings
    this.syncBotOtcOrderFilledRedisKey = this.configService.get<string>(
      'APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_KEY',
    );
    this.syncBotOtcOrderFilledRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncBotOtcOrderFilledRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appSyncBotOtcOrderFilledCron ||
      !this.syncBotOtcOrderFilledRedisKey ||
      !this.syncBotOtcOrderFilledRedisLockTimeout ||
      !this.syncBotOtcOrderFilledRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appSyncBotOtcOrderFilledCron
          ? ['APP_SYNC_BOT_OTC_ORDER_FILLED_CRON']
          : []),
        ...(!this.syncBotOtcOrderFilledRedisKey
          ? ['APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_KEY']
          : []),
        ...(!this.syncBotOtcOrderFilledRedisLockTimeout
          ? ['APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBotOtcOrderFilledRedisRefreshInterval
          ? ['APP_SYNC_BOT_OTC_ORDER_FILLED_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const botOtcOrderFilledSync = new CronJob(
      appSyncBotOtcOrderFilledCron,
      () => this.syncBotOtcOrderFilled(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.BOT_OTC_ORDER_FILLED_CONTROL,
      botOtcOrderFilledSync,
    );

    botOtcOrderFilledSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncBotOtcOrderFilled(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncBotOtcOrderFilledRedisKey,
      this.syncBotOtcOrderFilledRedisLockTimeout,
      this.syncBotOtcOrderFilledRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const botOtcOrderRepository = new BotOtcOrderDatabaseRepository();

          if (!this.kafkaService) {
            logger.error('Missing kafkaService');
            return;
          }

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const botOtcOrderEventEmitter = new BotOtcOrderEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const otcService = new OtcServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );

          logger.debug('Sync bot otc order filled started.');

          const controller = new HandleFilledBotOtcOrderController(
            logger,
            botOtcOrderRepository,
            otcService,
            botOtcOrderEventEmitter,
          );

          await controller.execute();

          // Fire events.
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync bot otc order filled.', {
            error,
          });
        }
      },
    );
  }
}
