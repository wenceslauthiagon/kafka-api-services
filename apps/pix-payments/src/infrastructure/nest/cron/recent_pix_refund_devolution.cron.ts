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
  TranslateService as NestTranslateService,
} from '@zro/common';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';
import {
  CRON_TASKS,
  PixRefundDevolutionDatabaseRepository,
  PixRefundDevolutionEventKafkaEmitter,
  TranslateI18nService,
} from '@zro/pix-payments/infrastructure';
import { SyncWaitingRecentPixRefundDevolutionController } from '@zro/pix-payments/interface';

interface RecentPixRefundDevolutionCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_KEY: string;
  APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class RecentPixRefundDevolutionCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingRecentPixRefundDevolutionRedisKey: string;
  private syncWaitingRecentPixRefundDevolutionRedisLockTimeout: number;
  private syncWaitingRecentPixRefundDevolutionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      RecentPixRefundDevolutionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({
      context: RecentPixRefundDevolutionCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.updatedAtThresholdInSeconds = Number(
      this.configService.get<number>(
        'APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS',
      ),
    );

    const appSyncWaitingRecentPixRefundDevolutionCron =
      this.configService.get<string>(
        'APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_CRON',
      );

    //Cron redis settings
    this.syncWaitingRecentPixRefundDevolutionRedisKey =
      this.configService.get<string>(
        'APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_KEY',
      );
    this.syncWaitingRecentPixRefundDevolutionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingRecentPixRefundDevolutionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingRecentPixRefundDevolutionCron ||
      !this.syncWaitingRecentPixRefundDevolutionRedisKey ||
      !this.syncWaitingRecentPixRefundDevolutionRedisLockTimeout ||
      !this.syncWaitingRecentPixRefundDevolutionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingRecentPixRefundDevolutionCron
          ? ['APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_CRON']
          : []),
        ...(!this.syncWaitingRecentPixRefundDevolutionRedisKey
          ? ['APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_KEY']
          : []),
        ...(!this.syncWaitingRecentPixRefundDevolutionRedisLockTimeout
          ? ['APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingRecentPixRefundDevolutionRedisRefreshInterval
          ? [
              'APP_SYNC_WAITING_RECENT_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL',
            ]
          : []),
      ]);
    }

    const syncWaitingRecentPixRefundDevolution = new CronJob(
      appSyncWaitingRecentPixRefundDevolutionCron,
      () => this.syncWaitingRecentPixRefundDevolution(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_REFUND_DEVOLUTION.SYNC_WAITING_RECENT,
      syncWaitingRecentPixRefundDevolution,
    );

    syncWaitingRecentPixRefundDevolution.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingRecentPixRefundDevolution() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingRecentPixRefundDevolutionRedisKey,
      this.syncWaitingRecentPixRefundDevolutionRedisLockTimeout,
      this.syncWaitingRecentPixRefundDevolutionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixPaymentGateway(logger);

        const pixRefundDevolutionRepository =
          new PixRefundDevolutionDatabaseRepository();

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new PixRefundDevolutionEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        const paymentTranslateService = new TranslateI18nService(
          this.translateService,
        );

        logger.debug('Sync waiting pix refund devolutions started.');

        const syncWaitingRecentPixRefundDevolutionController =
          new SyncWaitingRecentPixRefundDevolutionController(
            logger,
            paymentTranslateService,
            pixRefundDevolutionRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingRecentPixRefundDevolutionController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error(
            'Error with sync waiting pix refund devolutions.',
            error,
          );
        }
      },
    );
  }
}
