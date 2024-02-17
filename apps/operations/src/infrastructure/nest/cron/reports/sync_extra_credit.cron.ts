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

export interface SyncExtraCreditsReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_EXTRA_CREDITS_REPORTS_CRON: string;

  APP_SYNC_EXTRA_CREDITS_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_KEY: string;
  APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncExtraCreditsReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncExtraCreditsReportsRedisKey: string;
  private syncExtraCreditsReportsRedisLockTimeout: number;
  private syncExtraCreditsReportsRedisRefreshInterval: number;

  private syncExtraCreditsReportsTransactionTag: string;
  private syncExtraCreditsReportsClientBankCode: string;
  private syncExtraCreditsReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncExtraCreditsReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncExtraCreditsReportsCronService.name,
    });

    this.syncExtraCreditsReportsTransactionTag = this.configService.get<string>(
      'APP_SYNC_EXTRA_CREDITS_REPORTS_TRANSACTION_TAG',
    );
    this.syncExtraCreditsReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncExtraCreditsReportsCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );

    if (
      !this.syncExtraCreditsReportsTransactionTag ||
      !this.syncExtraCreditsReportsClientBankCode ||
      !this.syncExtraCreditsReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncExtraCreditsReportsTransactionTag
          ? ['APP_SYNC_EXTRA_CREDITS_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncExtraCreditsReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncExtraCreditsReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncExtraCreditsReportsCron = this.configService.get<string>(
      'APP_SYNC_EXTRA_CREDITS_REPORTS_CRON',
    );

    this.syncExtraCreditsReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_KEY',
    );
    this.syncExtraCreditsReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncExtraCreditsReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncExtraCreditsReportsCron ||
      !this.syncExtraCreditsReportsRedisKey ||
      !this.syncExtraCreditsReportsRedisLockTimeout ||
      !this.syncExtraCreditsReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncExtraCreditsReportsCron
          ? ['APP_SYNC_EXTRA_CREDITS_REPORTS_CRON']
          : []),
        ...(!this.syncExtraCreditsReportsRedisKey
          ? ['APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncExtraCreditsReportsRedisLockTimeout
          ? ['APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncExtraCreditsReportsRedisRefreshInterval
          ? ['APP_SYNC_EXTRA_CREDITS_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncExtraCreditsReportsCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_EXTRA_CREDITS_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_EXTRA_CREDITS_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncExtraCreditsReportsRedisKey,
      this.syncExtraCreditsReportsRedisLockTimeout,
      this.syncExtraCreditsReportsRedisRefreshInterval,
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

          const syncExtraCreditsReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncExtraCreditsReportsTransactionTag,
              this.syncExtraCreditsReportsClientBankCode,
              this.syncExtraCreditsReportsCurrencySymbol,
            );

          logger.debug('Sync reports extra credits.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncExtraCreditsReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports extra credits done.');
        } catch (error) {
          logger.error('Error with sync reports extra credits.', { error });
        }
      },
    );
  }
}
