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

export interface SyncP2PChatsReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_P2P_CHATS_REPORTS_CRON: string;

  APP_SYNC_P2P_CHATS_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_P2P_CHATS_REPORTS_REDIS_KEY: string;
  APP_SYNC_P2P_CHATS_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_P2P_CHATS_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncP2PChatsReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncP2PChatsReportsRedisKey: string;
  private syncP2PChatsReportsRedisLockTimeout: number;
  private syncP2PChatsReportsRedisRefreshInterval: number;

  private syncP2PChatsReportsTransactionTag: string;
  private syncP2PChatsReportsClientBankCode: string;
  private syncP2PChatsReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncP2PChatsReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncP2PChatsReportsCronService.name,
    });

    this.syncP2PChatsReportsTransactionTag = this.configService.get<string>(
      'APP_SYNC_P2P_CHATS_REPORTS_TRANSACTION_TAG',
    );
    this.syncP2PChatsReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncP2PChatsReportsCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );

    if (
      !this.syncP2PChatsReportsTransactionTag ||
      !this.syncP2PChatsReportsClientBankCode ||
      !this.syncP2PChatsReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncP2PChatsReportsTransactionTag
          ? ['APP_SYNC_P2P_CHATS_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncP2PChatsReportsClientBankCode
          ? ['APP_ZROBANK_ISPB']
          : []),
        ...(!this.syncP2PChatsReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncP2PChatsReportsCron = this.configService.get<string>(
      'APP_SYNC_P2P_CHATS_REPORTS_CRON',
    );

    this.syncP2PChatsReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_P2P_CHATS_REPORTS_REDIS_KEY',
    );
    this.syncP2PChatsReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_P2P_CHATS_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncP2PChatsReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_P2P_CHATS_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncP2PChatsReportsCron ||
      !this.syncP2PChatsReportsRedisKey ||
      !this.syncP2PChatsReportsRedisLockTimeout ||
      !this.syncP2PChatsReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncP2PChatsReportsCron
          ? ['APP_SYNC_P2P_CHATS_REPORTS_CRON']
          : []),
        ...(!this.syncP2PChatsReportsRedisKey
          ? ['APP_SYNC_P2P_CHATS_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncP2PChatsReportsRedisLockTimeout
          ? ['APP_SYNC_P2P_CHATS_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncP2PChatsReportsRedisRefreshInterval
          ? ['APP_SYNC_P2P_CHATS_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncP2PChatsReportsCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_P2P_CHATS_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_P2P_CHATS_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncP2PChatsReportsRedisKey,
      this.syncP2PChatsReportsRedisLockTimeout,
      this.syncP2PChatsReportsRedisRefreshInterval,
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

          const syncP2PChatsReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncP2PChatsReportsTransactionTag,
              this.syncP2PChatsReportsClientBankCode,
              this.syncP2PChatsReportsCurrencySymbol,
            );

          logger.debug('Sync reports p2p chats.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncP2PChatsReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports p2p chats done.');
        } catch (error) {
          logger.error('Error with sync reports p2p chats.', { error });
        }
      },
    );
  }
}
