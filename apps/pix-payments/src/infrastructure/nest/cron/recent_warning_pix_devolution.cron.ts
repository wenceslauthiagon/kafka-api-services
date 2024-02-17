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
  TranslateI18nService,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import { SyncWaitingRecentWarningPixDevolutionController } from '@zro/pix-payments/interface';

interface RecentWarningPixDevolutionCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_KEY: string;
  APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class RecentWarningPixDevolutionCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingRecentWarningPixDevolutionRedisKey: string;
  private syncWaitingRecentWarningPixDevolutionRedisLockTimeout: number;
  private syncWaitingRecentWarningPixDevolutionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      RecentWarningPixDevolutionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({
      context: RecentWarningPixDevolutionCronServiceInit.name,
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

    const appSyncWaitingRecentWarningPixDevolutionCron =
      this.configService.get<string>(
        'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_CRON',
      );

    //Cron redis settings
    this.syncWaitingRecentWarningPixDevolutionRedisKey =
      this.configService.get<string>(
        'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_KEY',
      );
    this.syncWaitingRecentWarningPixDevolutionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingRecentWarningPixDevolutionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingRecentWarningPixDevolutionCron ||
      !this.syncWaitingRecentWarningPixDevolutionRedisKey ||
      !this.syncWaitingRecentWarningPixDevolutionRedisLockTimeout ||
      !this.syncWaitingRecentWarningPixDevolutionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingRecentWarningPixDevolutionCron
          ? ['APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_CRON']
          : []),
        ...(!this.syncWaitingRecentWarningPixDevolutionRedisKey
          ? ['APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_KEY']
          : []),
        ...(!this.syncWaitingRecentWarningPixDevolutionRedisLockTimeout
          ? [
              'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT',
            ]
          : []),
        ...(!this.syncWaitingRecentWarningPixDevolutionRedisRefreshInterval
          ? [
              'APP_SYNC_WAITING_RECENT_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL',
            ]
          : []),
      ]);
    }

    const syncWaitingWarningPixDevolution = new CronJob(
      appSyncWaitingRecentWarningPixDevolutionCron,
      () => this.syncWaitingRecentWarningPixDevolution(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.WARNING_PIX_DEVOLUTION.SYNC_WAITING_RECENT,
      syncWaitingWarningPixDevolution,
    );

    syncWaitingWarningPixDevolution.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingRecentWarningPixDevolution() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingRecentWarningPixDevolutionRedisKey,
      this.syncWaitingRecentWarningPixDevolutionRedisLockTimeout,
      this.syncWaitingRecentWarningPixDevolutionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixPaymentGateway(logger);

        const warningPixDevolutionRepository =
          new WarningPixDevolutionDatabaseRepository();

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new WarningPixDevolutionEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        const paymentTranslateService = new TranslateI18nService(
          this.translateService,
        );

        logger.debug('Sync waiting warning pix devolutions started.');

        const syncWaitingRecentWarningPixDevolutionController =
          new SyncWaitingRecentWarningPixDevolutionController(
            logger,
            paymentTranslateService,
            warningPixDevolutionRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingRecentWarningPixDevolutionController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error(
            'Error with sync waiting warning pix devolutions.',
            error,
          );
        }
      },
    );
  }
}
