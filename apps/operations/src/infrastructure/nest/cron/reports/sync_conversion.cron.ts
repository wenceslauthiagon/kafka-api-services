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

export interface SyncConversionsReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_CONVERSIONS_REPORTS_CRON: string;

  APP_SYNC_CONVERSIONS_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_CONVERSIONS_REPORTS_REDIS_KEY: string;
  APP_SYNC_CONVERSIONS_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CONVERSIONS_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncConversionsReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncConversionsReportsRedisKey: string;
  private syncConversionsReportsRedisLockTimeout: number;
  private syncConversionsReportsRedisRefreshInterval: number;

  private syncConversionsReportsTransactionTag: string;
  private syncConversionsReportsClientBankCode: string;
  private syncConversionsReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncConversionsReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncConversionsReportsCronService.name,
    });

    this.syncConversionsReportsTransactionTag = this.configService.get<string>(
      'APP_SYNC_CONVERSIONS_REPORTS_TRANSACTION_TAG',
    );
    this.syncConversionsReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncConversionsReportsCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );

    if (
      !this.syncConversionsReportsTransactionTag ||
      !this.syncConversionsReportsClientBankCode ||
      !this.syncConversionsReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncConversionsReportsTransactionTag
          ? ['APP_SYNC_CONVERSIONS_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncConversionsReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncConversionsReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncConversionsReportsCron = this.configService.get<string>(
      'APP_SYNC_CONVERSIONS_REPORTS_CRON',
    );

    this.syncConversionsReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_CONVERSIONS_REPORTS_REDIS_KEY',
    );
    this.syncConversionsReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CONVERSIONS_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncConversionsReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CONVERSIONS_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncConversionsReportsCron ||
      !this.syncConversionsReportsRedisKey ||
      !this.syncConversionsReportsRedisLockTimeout ||
      !this.syncConversionsReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncConversionsReportsCron
          ? ['APP_SYNC_CONVERSIONS_REPORTS_CRON']
          : []),
        ...(!this.syncConversionsReportsRedisKey
          ? ['APP_SYNC_CONVERSIONS_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncConversionsReportsRedisLockTimeout
          ? ['APP_SYNC_CONVERSIONS_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncConversionsReportsRedisRefreshInterval
          ? ['APP_SYNC_CONVERSIONS_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncConversionsReportsCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_CONVERSIONS_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_CONVERSIONS_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncConversionsReportsRedisKey,
      this.syncConversionsReportsRedisLockTimeout,
      this.syncConversionsReportsRedisRefreshInterval,
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

          const syncConversionsReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncConversionsReportsTransactionTag,
              this.syncConversionsReportsClientBankCode,
              this.syncConversionsReportsCurrencySymbol,
            );

          logger.debug('Sync reports conversions.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncConversionsReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports conversions done.');
        } catch (error) {
          logger.error('Error with sync reports conversions.', { error });
        }
      },
    );
  }
}
