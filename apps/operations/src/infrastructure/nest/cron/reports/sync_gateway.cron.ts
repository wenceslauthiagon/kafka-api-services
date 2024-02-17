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

export interface SyncGatewayReportsCronConfig {
  APP_ENV: string;
  APP_SYNC_GATEWAY_REPORTS_CRON: string;

  APP_SYNC_GATEWAY_REPORTS_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;

  APP_SYNC_GATEWAY_REPORTS_REDIS_KEY: string;
  APP_SYNC_GATEWAY_REPORTS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_GATEWAY_REPORTS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncGatewayReportsCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncGatewayReportsRedisKey: string;
  private syncGatewayReportsRedisLockTimeout: number;
  private syncGatewayReportsRedisRefreshInterval: number;

  private syncGatewayReportsTransactionTag: string;
  private syncGatewayReportsClientBankCode: string;
  private syncGatewayReportsCurrencySymbol: string;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncGatewayReportsCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncGatewayReportsCronService.name,
    });

    this.syncGatewayReportsTransactionTag = this.configService.get<string>(
      'APP_SYNC_GATEWAY_REPORTS_TRANSACTION_TAG',
    );
    this.syncGatewayReportsClientBankCode =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.syncGatewayReportsCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );

    if (
      !this.syncGatewayReportsTransactionTag ||
      !this.syncGatewayReportsClientBankCode ||
      !this.syncGatewayReportsCurrencySymbol
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncGatewayReportsTransactionTag
          ? ['APP_SYNC_GATEWAY_REPORTS_TRANSACTION_TAG']
          : []),
        ...(!this.syncGatewayReportsClientBankCode ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.syncGatewayReportsCurrencySymbol
          ? ['APP_OPERATION_SYMBOL_CURRENCY_REAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncGatewayReportsCron = this.configService.get<string>(
      'APP_SYNC_GATEWAY_REPORTS_CRON',
    );

    this.syncGatewayReportsRedisKey = this.configService.get<string>(
      'APP_SYNC_GATEWAY_REPORTS_REDIS_KEY',
    );
    this.syncGatewayReportsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_GATEWAY_REPORTS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncGatewayReportsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_GATEWAY_REPORTS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncGatewayReportsCron ||
      !this.syncGatewayReportsRedisKey ||
      !this.syncGatewayReportsRedisLockTimeout ||
      !this.syncGatewayReportsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncGatewayReportsCron ? ['APP_SYNC_GATEWAY_REPORTS_CRON'] : []),
        ...(!this.syncGatewayReportsRedisKey
          ? ['APP_SYNC_GATEWAY_REPORTS_REDIS_KEY']
          : []),
        ...(!this.syncGatewayReportsRedisLockTimeout
          ? ['APP_SYNC_GATEWAY_REPORTS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncGatewayReportsRedisRefreshInterval
          ? ['APP_SYNC_GATEWAY_REPORTS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncGatewayReportsCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_GATEWAY_REPORTS,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_GATEWAY_REPORTS,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncGatewayReportsRedisKey,
      this.syncGatewayReportsRedisLockTimeout,
      this.syncGatewayReportsRedisRefreshInterval,
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

          const syncGatewayReportsController =
            new SyncOperationsReportsController(
              logger,
              operationRepository,
              currencyRepository,
              walletAccountRepository,
              reportService,
              userService,
              this.syncGatewayReportsTransactionTag,
              this.syncGatewayReportsClientBankCode,
              this.syncGatewayReportsCurrencySymbol,
            );

          logger.debug('Sync reports gateway.');

          const beginningOfDay = getMoment()
            .subtract(1, 'days')
            .startOf('day')
            .toDate();
          const endOfDay = getMoment()
            .subtract(1, 'days')
            .endOf('day')
            .toDate();

          await syncGatewayReportsController.execute({
            createdAtStart: beginningOfDay,
            createdAtEnd: endOfDay,
          });

          logger.debug('Sync reports gateway done.');
        } catch (error) {
          logger.error('Error with sync reports gateway.', { error });
        }
      },
    );
  }
}
