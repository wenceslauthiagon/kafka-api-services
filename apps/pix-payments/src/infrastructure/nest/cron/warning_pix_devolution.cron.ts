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
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
  TranslateI18nService,
} from '@zro/pix-payments/infrastructure';
import { SyncWaitingWarningPixDevolutionController } from '@zro/pix-payments/interface';

interface WarningPixDevolutionCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_KEY: string;
  APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class WarningPixDevolutionCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingWarningPixDevolutionRedisKey: string;
  private syncWaitingWarningPixDevolutionRedisLockTimeout: number;
  private syncWaitingWarningPixDevolutionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      WarningPixDevolutionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({
      context: WarningPixDevolutionCronServiceInit.name,
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

    const appSyncWaitingWarningPixDevolutionCron =
      this.configService.get<string>(
        'APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_CRON',
      );

    //Cron redis settings
    this.syncWaitingWarningPixDevolutionRedisKey =
      this.configService.get<string>(
        'APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_KEY',
      );
    this.syncWaitingWarningPixDevolutionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingWarningPixDevolutionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingWarningPixDevolutionCron ||
      !this.syncWaitingWarningPixDevolutionRedisKey ||
      !this.syncWaitingWarningPixDevolutionRedisLockTimeout ||
      !this.syncWaitingWarningPixDevolutionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingWarningPixDevolutionCron
          ? ['APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_CRON']
          : []),
        ...(!this.syncWaitingWarningPixDevolutionRedisKey
          ? ['APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_KEY']
          : []),
        ...(!this.syncWaitingWarningPixDevolutionRedisLockTimeout
          ? ['APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingWarningPixDevolutionRedisRefreshInterval
          ? ['APP_SYNC_WAITING_WARNING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const warningPixDevolutionSyncWaiting = new CronJob(
      appSyncWaitingWarningPixDevolutionCron,
      () => this.syncWaitingWarningPixDevolution(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.WARNING_PIX_DEVOLUTION.SYNC_WAITING,
      warningPixDevolutionSyncWaiting,
    );

    warningPixDevolutionSyncWaiting.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingWarningPixDevolution() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingWarningPixDevolutionRedisKey,
      this.syncWaitingWarningPixDevolutionRedisLockTimeout,
      this.syncWaitingWarningPixDevolutionRedisRefreshInterval,
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

        const syncWaitingWarningPixDevolutionController =
          new SyncWaitingWarningPixDevolutionController(
            logger,
            paymentTranslateService,
            warningPixDevolutionRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingWarningPixDevolutionController.execute();

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
