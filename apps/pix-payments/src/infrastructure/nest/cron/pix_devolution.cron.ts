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
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
  TranslateI18nService,
} from '@zro/pix-payments/infrastructure';
import { SyncWaitingPixDevolutionController } from '@zro/pix-payments/interface';

interface PixDevolutionCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_PIX_DEVOLUTION_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_KEY: string;
  APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixDevolutionCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingPixDevolutionRedisKey: string;
  private syncWaitingPixDevolutionRedisLockTimeout: number;
  private syncWaitingPixDevolutionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PixDevolutionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({ context: PixDevolutionCronServiceInit.name });
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

    const appSyncWaitingPixDevolutionCron = this.configService.get<string>(
      'APP_SYNC_WAITING_PIX_DEVOLUTION_CRON',
    );

    //Cron redis settings
    this.syncWaitingPixDevolutionRedisKey = this.configService.get<string>(
      'APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_KEY',
    );
    this.syncWaitingPixDevolutionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingPixDevolutionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingPixDevolutionCron ||
      !this.syncWaitingPixDevolutionRedisKey ||
      !this.syncWaitingPixDevolutionRedisLockTimeout ||
      !this.syncWaitingPixDevolutionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingPixDevolutionCron
          ? ['APP_SYNC_WAITING_PIX_DEVOLUTION_CRON']
          : []),
        ...(!this.syncWaitingPixDevolutionRedisKey
          ? ['APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_KEY']
          : []),
        ...(!this.syncWaitingPixDevolutionRedisLockTimeout
          ? ['APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingPixDevolutionRedisRefreshInterval
          ? ['APP_SYNC_WAITING_PIX_DEVOLUTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const pixDevolutionSyncWaiting = new CronJob(
      appSyncWaitingPixDevolutionCron,
      () => this.syncWaitingPixDevolution(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_DEVOLUTION.SYNC_WAITING,
      pixDevolutionSyncWaiting,
    );

    pixDevolutionSyncWaiting.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingPixDevolution() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingPixDevolutionRedisKey,
      this.syncWaitingPixDevolutionRedisLockTimeout,
      this.syncWaitingPixDevolutionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixPaymentGateway(logger);

        const pixDevolutionRepository = new PixDevolutionDatabaseRepository();

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new PixDevolutionEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        const paymentTranslateService = new TranslateI18nService(
          this.translateService,
        );

        logger.debug('Sync waiting pixDevolutions started.');

        const syncWaitingPixDevolutionController =
          new SyncWaitingPixDevolutionController(
            logger,
            paymentTranslateService,
            pixDevolutionRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingPixDevolutionController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync waiting pixDevolutions.', error);
        }
      },
    );
  }
}
