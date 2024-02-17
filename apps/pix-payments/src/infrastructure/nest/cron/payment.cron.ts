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
import {
  SyncScheduledPaymentController,
  SyncWaitingPaymentController,
} from '@zro/pix-payments/interface';

interface PaymentCronConfig {
  APP_ENV: string;
  APP_SYNC_SCHEDULED_PAYMENT_CRON: string;
  APP_SYNC_WAITING_PAYMENT_CRON: string;
  APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS: number;

  APP_SYNC_SCHEDULED_PAYMENT_REDIS_KEY: string;
  APP_SYNC_SCHEDULED_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_SCHEDULED_PAYMENT_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_WAITING_PAYMENT_REDIS_KEY: string;
  APP_SYNC_WAITING_PAYMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WAITING_PAYMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PaymentCronServiceInit implements OnModuleInit {
  private updatedAtThresholdInSeconds: number;

  /**
   * Envs for cron settings
   */
  private syncScheduledPaymentRedisKey: string;
  private syncScheduledPaymentRedisLockTimeout: number;
  private syncScheduledPaymentRedisRefreshInterval: number;

  private syncWaitingPaymentRedisKey: string;
  private syncWaitingPaymentRedisLockTimeout: number;
  private syncWaitingPaymentRedisRefreshInterval: number;

  /**
   * Get cron timestamp env
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PaymentCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
    private readonly translateService: NestTranslateService,
  ) {
    this.logger = logger.child({ context: PaymentCronServiceInit.name });
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

    const pixPaymentSyncScheduled = new CronJob(
      this.configService.get<string>('APP_SYNC_SCHEDULED_PAYMENT_CRON'),
      () => this.syncScheduledPixPayments(),
    );
    const pixPaymentSyncWaiting = new CronJob(
      this.configService.get<string>('APP_SYNC_WAITING_PAYMENT_CRON'),
      () => this.syncWaitingPixPayments(),
    );

    //Cron redis settings
    this.syncScheduledPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_SCHEDULED_PAYMENT_REDIS_KEY',
    );
    this.syncScheduledPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_SCHEDULED_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncScheduledPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_SCHEDULED_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    this.syncWaitingPaymentRedisKey = this.configService.get<string>(
      'APP_SYNC_WAITING_PAYMENT_REDIS_KEY',
    );
    this.syncWaitingPaymentRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PAYMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWaitingPaymentRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WAITING_PAYMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.updatedAtThresholdInSeconds ||
      !pixPaymentSyncScheduled ||
      !pixPaymentSyncWaiting ||
      !this.syncScheduledPaymentRedisKey ||
      !this.syncScheduledPaymentRedisLockTimeout ||
      !this.syncScheduledPaymentRedisRefreshInterval ||
      !this.syncWaitingPaymentRedisKey ||
      !this.syncWaitingPaymentRedisLockTimeout ||
      !this.syncWaitingPaymentRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.updatedAtThresholdInSeconds
          ? ['APP_PIX_PAYMENT_UPDATED_AT_THRESHOLD_SECONDS']
          : []),
        ...(!pixPaymentSyncScheduled
          ? ['APP_SYNC_SCHEDULED_PAYMENT_CRON']
          : []),
        ...(!pixPaymentSyncWaiting ? ['APP_SYNC_WAITING_PAYMENT_CRON'] : []),
        ...(!this.syncScheduledPaymentRedisKey
          ? ['APP_SYNC_SCHEDULED_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncScheduledPaymentRedisLockTimeout
          ? ['APP_SYNC_SCHEDULED_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncScheduledPaymentRedisRefreshInterval
          ? ['APP_SYNC_SCHEDULED_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.syncWaitingPaymentRedisKey
          ? ['APP_SYNC_WAITING_PAYMENT_REDIS_KEY']
          : []),
        ...(!this.syncWaitingPaymentRedisLockTimeout
          ? ['APP_SYNC_WAITING_PAYMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWaitingPaymentRedisRefreshInterval
          ? ['APP_SYNC_WAITING_PAYMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_SCHEDULED,
      pixPaymentSyncScheduled,
    );
    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PAYMENT.SYNC_WAITING,
      pixPaymentSyncWaiting,
    );

    pixPaymentSyncScheduled.start();
    pixPaymentSyncWaiting.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncScheduledPixPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncScheduledPaymentRedisKey,
      this.syncScheduledPaymentRedisLockTimeout,
      this.syncScheduledPaymentRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const pixPaymentsRepository = new PaymentDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PaymentEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          logger.info('Sync scheduled pixPayments started.');

          const syncScheduledPixPaymentsController =
            new SyncScheduledPaymentController(
              logger,
              pixPaymentsRepository,
              serviceEmitter,
            );

          await syncScheduledPixPaymentsController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync scheduled pix payments.', error);
        }
      },
    );
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWaitingPixPayments() {
    await this.redisService.semaphoreRefresh(
      this.syncWaitingPaymentRedisKey,
      this.syncWaitingPaymentRedisLockTimeout,
      this.syncWaitingPaymentRedisRefreshInterval,
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

        logger.debug('Sync waiting pixPayments started.');

        const syncWaitingPixPaymentsController =
          new SyncWaitingPaymentController(
            logger,
            paymentTranslateService,
            pixPaymentsRepository,
            serviceEmitter,
            pspGateway,
            this.updatedAtThresholdInSeconds,
          );

        try {
          await syncWaitingPixPaymentsController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync waiting pix payments.', error);
        }
      },
    );
  }
}
