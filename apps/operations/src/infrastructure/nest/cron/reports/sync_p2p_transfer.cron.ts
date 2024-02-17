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

export interface SyncP2PTransfersReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_P2P_TRANSFERS_REPORTS_CRON: string;

  APP_SYNC_P2P_TRANSFERS_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_KEY: string;
  APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncP2PTransfersReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncP2PTransfersReportsRedisKey: string;
  private syncP2PTransfersReportsRedisLockTimeout: number;
  private syncP2PTransfersReportsRedisRefreshInterval: number;

  private syncP2PTransfersReportsTransactionTag: string;
  private syncP2PTransfersReportsClientBankCode: string;
  private syncP2PTransfersReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncP2PTransfersReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncP2PTransfersReportsCronService.name,
    });

    this.syncP2PTransfersReportsTransactionTag = this.configService.get<string>(
      'APP_SYNC_P2P_TRANSFERS_REPORTS_TRANSACTION_TAG',
    );
    this.syncP2PTransfersReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncP2PTransfersReportsCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );

    if (
      !this.syncP2PTransfersReportsTransactionTag ||
      !this.syncP2PTransfersReportsClientBankCode ||
      !this.syncP2PTransfersReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncP2PTransfersReportsTransactionTag
          ? ['APP_SYNC_P2P_TRANSFERS_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncP2PTransfersReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncP2PTransfersReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncP2PTransfersReportsCron = this.configService.get<string>(
      'APP_SYNC_P2P_TRANSFERS_REPORTS_CRON',
    );

    this.syncP2PTransfersReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_KEY',
    );
    this.syncP2PTransfersReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncP2PTransfersReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncP2PTransfersReportsCron ||
      !this.syncP2PTransfersReportsRedisKey ||
      !this.syncP2PTransfersReportsRedisLockTimeout ||
      !this.syncP2PTransfersReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncP2PTransfersReportsCron
          ? ['APP_SYNC_P2P_TRANSFERS_REPORTS_CRON']
          : []),
        ...(!this.syncP2PTransfersReportsRedisKey
          ? ['APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncP2PTransfersReportsRedisLockTimeout
          ? ['APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncP2PTransfersReportsRedisRefreshInterval
          ? ['APP_SYNC_P2P_TRANSFERS_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncP2PTransfersReportsCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_P2P_TRANSFERS_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_P2P_TRANSFERS_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncP2PTransfersReportsRedisKey,
      this.syncP2PTransfersReportsRedisLockTimeout,
      this.syncP2PTransfersReportsRedisRefreshInterval,
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

          const syncP2PTransfersReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncP2PTransfersReportsTransactionTag,
              this.syncP2PTransfersReportsClientBankCode,
              this.syncP2PTransfersReportsCurrencySymbol,
            );

          logger.debug('Sync reports p2p transfers.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncP2PTransfersReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports p2p transfers done.');
        } catch (error) {
          logger.error('Error with sync reports p2p transfers.', { error });
        }
      },
    );
  }
}
