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

export interface SyncAssetsForfeituresReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_ASSETS_FORFEITURES_REPORTS_CRON: string;

  APP_SYNC_ASSETS_FORFEITURES_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_KEY: string;
  APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncAssetsForfeituresReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncAssetsForfeituresReportsRedisKey: string;
  private syncAssetsForfeituresReportsRedisLockTimeout: number;
  private syncAssetsForfeituresReportsRedisRefreshInterval: number;

  private syncAssetsForfeituresReportsTransactionTag: string;
  private syncAssetsForfeituresReportsClientBankCode: string;
  private syncAssetsForfeituresReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncAssetsForfeituresReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncAssetsForfeituresReportsCronService.name,
    });

    this.syncAssetsForfeituresReportsTransactionTag =
      this.configService.get<string>(
        'APP_SYNC_ASSETS_FORFEITURES_REPORTS_TRANSACTION_TAG',
      );
    this.syncAssetsForfeituresReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncAssetsForfeituresReportsCurrencySymbol =
      this.configService.get<string>('APP_OPERATION_SYMBOL_CURRENCY_REAL');

    if (
      !this.syncAssetsForfeituresReportsTransactionTag ||
      !this.syncAssetsForfeituresReportsClientBankCode ||
      !this.syncAssetsForfeituresReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncAssetsForfeituresReportsTransactionTag
          ? ['APP_SYNC_ASSETS_FORFEITURES_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncAssetsForfeituresReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncAssetsForfeituresReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncAssetsForfeituresReportsCron = this.configService.get<string>(
      'APP_SYNC_ASSETS_FORFEITURES_REPORTS_CRON',
    );

    this.syncAssetsForfeituresReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_KEY',
    );
    this.syncAssetsForfeituresReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncAssetsForfeituresReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncAssetsForfeituresReportsCron ||
      !this.syncAssetsForfeituresReportsRedisKey ||
      !this.syncAssetsForfeituresReportsRedisLockTimeout ||
      !this.syncAssetsForfeituresReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncAssetsForfeituresReportsCron
          ? ['APP_SYNC_ASSETS_FORFEITURES_REPORTS_CRON']
          : []),
        ...(!this.syncAssetsForfeituresReportsRedisKey
          ? ['APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncAssetsForfeituresReportsRedisLockTimeout
          ? ['APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncAssetsForfeituresReportsRedisRefreshInterval
          ? ['APP_SYNC_ASSETS_FORFEITURES_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncAssetsForfeituresReportsCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_ASSETS_FORFEITURES_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_ASSETS_FORFEITURES_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncAssetsForfeituresReportsRedisKey,
      this.syncAssetsForfeituresReportsRedisLockTimeout,
      this.syncAssetsForfeituresReportsRedisRefreshInterval,
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

          const syncAssetsForfeituresReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncAssetsForfeituresReportsTransactionTag,
              this.syncAssetsForfeituresReportsClientBankCode,
              this.syncAssetsForfeituresReportsCurrencySymbol,
            );

          logger.debug('Sync reports assets forfeitures.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncAssetsForfeituresReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports assets forfeitures done.');
        } catch (error) {
          logger.error('Error with sync reports assets forfeitures.', {
            error,
          });
        }
      },
    );
  }
}
