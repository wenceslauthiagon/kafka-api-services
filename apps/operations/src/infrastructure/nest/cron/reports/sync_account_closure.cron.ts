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

export interface SyncAccountsClosuresReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_CRON: string;

  APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_KEY: string;
  APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncAccountsClosuresReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncAccountsClosuresReportsRedisKey: string;
  private syncAccountsClosuresReportsRedisLockTimeout: number;
  private syncAccountsClosuresReportsRedisRefreshInterval: number;

  private syncAccountsClosuresReportsTransactionTag: string;
  private syncAccountsClosuresReportsClientBankCode: string;
  private syncAccountsClosuresReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncAccountsClosuresReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncAccountsClosuresReportsCronService.name,
    });

    this.syncAccountsClosuresReportsTransactionTag =
      this.configService.get<string>(
        'APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_TRANSACTION_TAG',
      );
    this.syncAccountsClosuresReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncAccountsClosuresReportsCurrencySymbol =
      this.configService.get<string>('APP_OPERATION_SYMBOL_CURRENCY_REAL');

    if (
      !this.syncAccountsClosuresReportsTransactionTag ||
      !this.syncAccountsClosuresReportsClientBankCode ||
      !this.syncAccountsClosuresReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncAccountsClosuresReportsTransactionTag
          ? ['APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncAccountsClosuresReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncAccountsClosuresReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncAccountsClosuresReportsCron = this.configService.get<string>(
      'APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_CRON',
    );

    this.syncAccountsClosuresReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_KEY',
    );
    this.syncAccountsClosuresReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncAccountsClosuresReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncAccountsClosuresReportsCron ||
      !this.syncAccountsClosuresReportsRedisKey ||
      !this.syncAccountsClosuresReportsRedisLockTimeout ||
      !this.syncAccountsClosuresReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncAccountsClosuresReportsCron
          ? ['APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_CRON']
          : []),
        ...(!this.syncAccountsClosuresReportsRedisKey
          ? ['APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncAccountsClosuresReportsRedisLockTimeout
          ? ['APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncAccountsClosuresReportsRedisRefreshInterval
          ? ['APP_SYNC_ACCOUNTS_CLOSURES_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncAccountsClosuresReportsCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_ACCOUNTS_CLOSURES_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_ACCOUNTS_CLOSURES_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncAccountsClosuresReportsRedisKey,
      this.syncAccountsClosuresReportsRedisLockTimeout,
      this.syncAccountsClosuresReportsRedisRefreshInterval,
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

          const syncAccountsClosuresReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncAccountsClosuresReportsTransactionTag,
              this.syncAccountsClosuresReportsClientBankCode,
              this.syncAccountsClosuresReportsCurrencySymbol,
            );

          logger.debug('Sync reports accounts closures.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncAccountsClosuresReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports accounts closures done.');
        } catch (error) {
          logger.error('Error with sync reports accounts closures.', { error });
        }
      },
    );
  }
}
