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
import { SyncWaitingPixRefundDevolutionController } from '@zro/pix-payments/interface';

interface PixRefundDevolutionCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_KEY: string;
  APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixRefundDevolutionCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingPixRefundDevolutionRedisKey: string;
  private syncWaitingPixRefundDevolutionRedisLockTimeout: number;
  private syncWaitingPixRefundDevolutionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PixRefundDevolutionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({
      context: PixRefundDevolutionCronServiceInit.name,
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

    const appSyncWaitingPixRefundDevolutionCron =
      this.configService.get<string>(
        'APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_CRON',
      );

    //Cron redis settings
    this.syncWaitingPixRefundDevolutionRedisKey =
      this.configService.get<string>(
        'APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_KEY',
      );
    this.syncWaitingPixRefundDevolutionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingPixRefundDevolutionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingPixRefundDevolutionCron ||
      !this.syncWaitingPixRefundDevolutionRedisKey ||
      !this.syncWaitingPixRefundDevolutionRedisLockTimeout ||
      !this.syncWaitingPixRefundDevolutionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingPixRefundDevolutionCron
          ? ['APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_CRON']
          : []),
        ...(!this.syncWaitingPixRefundDevolutionRedisKey
          ? ['APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_KEY']
          : []),
        ...(!this.syncWaitingPixRefundDevolutionRedisLockTimeout
          ? ['APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingPixRefundDevolutionRedisRefreshInterval
          ? ['APP_SYNC_WAITING_PIX_REFUND_DEVOLUTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const pixRefundDevolutionSyncWaiting = new CronJob(
      appSyncWaitingPixRefundDevolutionCron,
      () => this.syncWaitingPixRefundDevolution(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_REFUND_DEVOLUTION.SYNC_WAITING,
      pixRefundDevolutionSyncWaiting,
    );

    pixRefundDevolutionSyncWaiting.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingPixRefundDevolution() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingPixRefundDevolutionRedisKey,
      this.syncWaitingPixRefundDevolutionRedisLockTimeout,
      this.syncWaitingPixRefundDevolutionRedisRefreshInterval,
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

        const syncWaitingPixRefundDevolutionController =
          new SyncWaitingPixRefundDevolutionController(
            logger,
            paymentTranslateService,
            pixRefundDevolutionRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingPixRefundDevolutionController.execute();

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
