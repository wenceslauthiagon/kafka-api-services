import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaService,
  MissingEnvVarException,
  RedisService,
  getMoment,
} from '@zro/common';
import { SyncOperationsReportsController } from '@zro/operations/interface';
import {
  CRON_TASKS,
  OperationDatabaseRepository,
  ReportServiceKafka,
  UserServiceKafka,
  WalletAccountDatabaseRepository,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';

export interface SyncDepositsReceiveReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_DEPOSITS_RECEIVE_REPORTS_CRON: string;

  APP_SYNC_DEPOSITS_RECEIVE_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_KEY: string;
  APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncDepositsReceiveReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncDepositsReceiveReportsRedisKey: string;
  private syncDepositsReceiveReportsRedisLockTimeout: number;
  private syncDepositsReceiveReportsRedisRefreshInterval: number;

  private syncDepositsReceiveReportsTransactionTag: string;
  private syncDepositsReceiveReportsClientBankCode: string;
  private syncDepositsReceiveReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncDepositsReceiveReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncDepositsReceiveReportsCronService.name,
    });

    this.syncDepositsReceiveReportsTransactionTag =
      this.configService.get<string>(
        'APP_SYNC_DEPOSITS_RECEIVE_REPORTS_TRANSACTION_TAG',
      );
    this.syncDepositsReceiveReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncDepositsReceiveReportsCurrencySymbol =
      this.configService.get<string>('APP_OPERATION_SYMBOL_CURRENCY_REAL');

    if (
      !this.syncDepositsReceiveReportsTransactionTag ||
      !this.syncDepositsReceiveReportsClientBankCode ||
      !this.syncDepositsReceiveReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncDepositsReceiveReportsTransactionTag
          ? ['APP_SYNC_DEPOSITS_RECEIVE_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncDepositsReceiveReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncDepositsReceiveReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncDepositsReceiveReportsCron = this.configService.get<string>(
      'APP_SYNC_DEPOSITS_RECEIVE_REPORTS_CRON',
    );

    this.syncDepositsReceiveReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_KEY',
    );
    this.syncDepositsReceiveReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncDepositsReceiveReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncDepositsReceiveReportsCron ||
      !this.syncDepositsReceiveReportsRedisKey ||
      !this.syncDepositsReceiveReportsRedisLockTimeout ||
      !this.syncDepositsReceiveReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncDepositsReceiveReportsCron
          ? ['APP_SYNC_DEPOSITS_RECEIVE_REPORTS_CRON']
          : []),
        ...(!this.syncDepositsReceiveReportsRedisKey
          ? ['APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncDepositsReceiveReportsRedisLockTimeout
          ? ['APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncDepositsReceiveReportsRedisRefreshInterval
          ? ['APP_SYNC_DEPOSITS_RECEIVE_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncDepositsReceiveReportsCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_DEPOSITS_RECEIVE_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_DEPOSITS_RECEIVE_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncDepositsReceiveReportsRedisKey,
      this.syncDepositsReceiveReportsRedisLockTimeout,
      this.syncDepositsReceiveReportsRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const reportService = new ReportServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );
          const userService = new UserServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );

          const operationRepository = new OperationDatabaseRepository();
          const walletAccountRepository = new WalletAccountDatabaseRepository();
          const currencyRepository = new CurrencyDatabaseRepository();

          const syncDepositsReceiveReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncDepositsReceiveReportsTransactionTag,
              this.syncDepositsReceiveReportsClientBankCode,
              this.syncDepositsReceiveReportsCurrencySymbol,
            );

          logger.debug('Sync reports deposits receive.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncDepositsReceiveReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports deposits receive done.');
        } catch (error) {
          logger.error('Error with sync reports deposits receive.', { error });
        }
      },
    );
  }
}
