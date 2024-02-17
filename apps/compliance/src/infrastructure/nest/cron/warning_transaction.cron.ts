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
  WarningTransactionDatabaseRepository,
  WarningTransactionEventKafkaEmitter,
  PixPaymentServiceKafka,
} from '@zro/compliance/infrastructure';
import { SyncWarningTransactionDueDateController } from '@zro/compliance/interface';

export interface WarningTransactionCronConfig {
  APP_ENV: string;
  APP_SYNC_WARNING_TRANSACTIONS_DUE_DATE_CRON: string;

  APP_SYNC_WARNING_TRANSACTIONS_REDIS_KEY: string;
  APP_SYNC_WARNING_TRANSACTIONS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_WARNING_TRANSACTIONS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class WarningTransactionCronServiceInit implements OnModuleInit {
  /**
   * Envs for cron settings
   */
  private syncWarningTransactionRedisKey: string;
  private syncWarningTransactionRedisLockTimeout: number;
  private syncWarningTransactionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<WarningTransactionCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: WarningTransactionCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appSyncWarningTransactionDueDateCron = this.configService.get<string>(
      'APP_SYNC_WARNING_TRANSACTIONS_DUE_DATE_CRON',
    );

    //Cron redis settings
    this.syncWarningTransactionRedisKey = this.configService.get<string>(
      'APP_SYNC_WARNING_TRANSACTIONS_REDIS_KEY',
    );
    this.syncWarningTransactionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_WARNING_TRANSACTIONS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncWarningTransactionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_WARNING_TRANSACTIONS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appSyncWarningTransactionDueDateCron ||
      !this.syncWarningTransactionRedisKey ||
      !this.syncWarningTransactionRedisLockTimeout ||
      !this.syncWarningTransactionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appSyncWarningTransactionDueDateCron
          ? ['APP_SYNC_WARNING_TRANSACTIONS_DUE_DATE_CRON']
          : []),
        ...(!this.syncWarningTransactionRedisKey
          ? ['APP_SYNC_WARNING_TRANSACTIONS_REDIS_KEY']
          : []),
        ...(!this.syncWarningTransactionRedisLockTimeout
          ? ['APP_SYNC_WARNING_TRANSACTIONS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncWarningTransactionRedisRefreshInterval
          ? ['APP_SYNC_WARNING_TRANSACTIONS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const warningTransactionSyncDueDate = new CronJob(
      appSyncWarningTransactionDueDateCron,
      () => this.syncWarningTransactionDueDate(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.WARNING_TRANSACTION.SYNC_DUE_DATE,
      warningTransactionSyncDueDate,
    );

    warningTransactionSyncDueDate.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncWarningTransactionDueDate() {
    await this.redisService.semaphoreRefresh(
      this.syncWarningTransactionRedisKey,
      this.syncWarningTransactionRedisLockTimeout,
      this.syncWarningTransactionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const warningTransactionRepository =
            new WarningTransactionDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new WarningTransactionEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const pixPaymentService = new PixPaymentServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          logger.debug('Sync warning transaction due date started.');

          const syncWarningTransactionDueDateController =
            new SyncWarningTransactionDueDateController(
              logger,
              warningTransactionRepository,
              serviceEmitter,
              pixPaymentService,
            );

          await syncWarningTransactionDueDateController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync warning transactions due date.', {
            error,
          });
        }
      },
    );
  }
}
