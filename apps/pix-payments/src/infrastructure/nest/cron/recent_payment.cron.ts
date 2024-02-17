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
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  TranslateI18nService,
} from '@zro/pix-payments/infrastructure';
import { SyncWaitingRecentPaymentController } from '@zro/pix-payments/interface';

interface RecentPaymentCronConfig {
  APP_ENV: string;
  APP_SYNC_WAITING_RECENT_PIX_PAYMENT_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_KEY: string;
  APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class RecentPaymentCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncWaitingRecentPaymentRedisKey: string;
  private syncWaitingRecentPaymentRedisLockTimeout: number;
  private syncWaitingRecentPaymentRedisRefreshInterval: number;

  /**
   * Get cron timestamp env
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      RecentPaymentCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({ context: RecentPaymentCronServiceInit.name });
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

    const appSyncWaitingRecentPixPaymentCron = this.configService.get<string>(
      'APP_SYNC_WAITING_RECENT_PIX_PAYMENT_CRON',
    );

    //Cron redis settings
    this.syncWaitingRecentPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_KEY',
    );
    this.syncWaitingRecentPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingRecentPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !appSyncWaitingRecentPixPaymentCron ||
      !this.syncWaitingRecentPaymentRedisKey ||
      !this.syncWaitingRecentPaymentRedisLockTimeout ||
      !this.syncWaitingRecentPaymentRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!appSyncWaitingRecentPixPaymentCron
          ? ['APP_SYNC_WAITING_RECENT_PIX_PAYMENT_CRON']
          : []),
        ...(!this.syncWaitingRecentPaymentRedisKey
          ? ['APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncWaitingRecentPaymentRedisLockTimeout
          ? ['APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingRecentPaymentRedisRefreshInterval
          ? ['APP_SYNC_WAITING_RECENT_PIX_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const syncWaitingRecentPayment = new CronJob(
      appSyncWaitingRecentPixPaymentCron,
      () => this.syncWaitingRecentPixPayments(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_WAITING_RECENT,
      syncWaitingRecentPayment,
    );

    syncWaitingRecentPayment.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingRecentPixPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingRecentPaymentRedisKey,
      this.syncWaitingRecentPaymentRedisLockTimeout,
      this.syncWaitingRecentPaymentRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixPaymentGateway(logger);

        const pixPaymentsRepository = new PaymentDatabaseRepository();

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new PaymentEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        const paymentTranslateService = new TranslateI18nService(
          this.translateService,
        );

        logger.debug('Sync waiting recent pix payments started.');

        const syncWaitingRecentPixPaymentsController =
          new SyncWaitingRecentPaymentController(
            logger,
            paymentTranslateService,
            pixPaymentsRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingRecentPixPaymentsController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync waiting pix payments.', error);
        }
      },
    );
  }
}
