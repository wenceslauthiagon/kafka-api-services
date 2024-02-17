import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  CRON_TASKS,
  TransactionRedisRepository,
  TransactionCurrentPageRedisRepository,
  ReportServiceKafka,
  PaymentsGatewayAxiosService,
  PaymentsGatewayConfig,
} from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionController,
  SyncTransactionController,
} from '@zro/payments-gateway/interface';

export interface TransactionCronConfig {
  APP_ENV: string;
  APP_SYNC_TRANSACTION_CRON: string;
  APP_GET_TRANSACTION_CRON: string;
  APP_TRANSACTIONS_DEFAULT_TTL_MS: number;

  APP_SYNC_TRANSACTION_REDIS_KEY: string;
  APP_SYNC_TRANSACTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_TRANSACTION_REDIS_REFRESH_INTERVAL: number;

  APP_GET_TRANSACTION_REDIS_KEY: string;
  APP_GET_TRANSACTION_REDIS_LOCK_TIMEOUT: number;
  APP_GET_TRANSACTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class TransactionCronServiceInit implements OnModuleInit {
  private readonly transactionRedisRepository: TransactionRedisRepository;
  private readonly transactionCurrentPageRedisRepository: TransactionCurrentPageRedisRepository;
  private readonly transactionTTL: number;

  private readonly syncTransactionRedisKey: string;
  private readonly syncTransactionRedisLockTimeout: number;
  private readonly syncTransactionRedisRefreshInterval: number;
  private readonly getTransactionRedisKey: string;
  private readonly getTransactionRedisLockTimeout: number;
  private readonly getTransactionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      TransactionCronConfig & PaymentsGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: TransactionCronServiceInit.name,
    });

    //Default 30 dias em ms - 2592000000
    this.transactionTTL = Number(
      this.configService.get<number>(
        'APP_TRANSACTIONS_DEFAULT_TTL_MS',
        2592000000,
      ),
    );

    //Cron redis settings
    this.syncTransactionRedisKey = this.configService.get<string>(
      'APP_SYNC_TRANSACTION_REDIS_KEY',
    );
    this.syncTransactionRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_TRANSACTION_REDIS_LOCK_TIMEOUT'),
    );
    this.syncTransactionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_TRANSACTION_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.getTransactionRedisKey = this.configService.get<string>(
      'APP_GET_TRANSACTION_REDIS_KEY',
    );
    this.getTransactionRedisLockTimeout = Number(
      this.configService.get<number>('APP_GET_TRANSACTION_REDIS_LOCK_TIMEOUT'),
    );
    this.getTransactionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_GET_TRANSACTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncTransactionRedisKey ||
      !this.syncTransactionRedisLockTimeout ||
      !this.syncTransactionRedisRefreshInterval ||
      !this.getTransactionRedisKey ||
      !this.getTransactionRedisLockTimeout ||
      !this.getTransactionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncTransactionRedisKey
          ? ['APP_SYNC_TRANSACTION_REDIS_KEY']
          : []),
        ...(!this.syncTransactionRedisLockTimeout
          ? ['APP_SYNC_TRANSACTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncTransactionRedisRefreshInterval
          ? ['APP_SYNC_TRANSACTION_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.getTransactionRedisKey
          ? ['APP_GET_TRANSACTION_REDIS_KEY']
          : []),
        ...(!this.getTransactionRedisLockTimeout
          ? ['APP_GET_TRANSACTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.getTransactionRedisRefreshInterval
          ? ['APP_GET_TRANSACTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.transactionRedisRepository = new TransactionRedisRepository(
      this.redisService,
      this.transactionTTL,
    );

    this.transactionCurrentPageRedisRepository =
      new TransactionCurrentPageRedisRepository(this.redisService);
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appSyncTransactionCron = this.configService.get<string>(
      'APP_SYNC_TRANSACTION_CRON',
    );

    const appGetTransactionCron = this.configService.get<string>(
      'APP_GET_TRANSACTION_CRON',
    );

    if (!appSyncTransactionCron || !appGetTransactionCron) {
      throw new MissingEnvVarException([
        ...(!appSyncTransactionCron ? ['APP_SYNC_TRANSACTION_CRON'] : []),
        ...(!appGetTransactionCron ? ['APP_GET_TRANSACTION_CRON'] : []),
      ]);
    }

    const transactionSync = new CronJob(appSyncTransactionCron, () =>
      this.syncTransaction(),
    );

    const transactionGet = new CronJob(appGetTransactionCron, () =>
      this.getTransaction(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.TRANSACTION.SYNC,
      transactionSync,
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.TRANSACTION.GET,
      transactionGet,
    );

    transactionSync.start();
    transactionGet.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncTransaction() {
    await this.redisService.semaphoreRefresh(
      this.syncTransactionRedisKey,
      this.syncTransactionRedisLockTimeout,
      this.syncTransactionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Sync transaction started.');

        try {
          const reportService = new ReportServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          logger.debug('Sync transactions started.');

          const syncTransactionController = new SyncTransactionController(
            logger,
            this.transactionRedisRepository,
            reportService,
          );

          await syncTransactionController.execute();
        } catch (error) {
          logger.error('Error with sync transactions.', { error });
        }
      },
    );
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async getTransaction() {
    await this.redisService.semaphoreRefresh(
      this.getTransactionRedisKey,
      this.getTransactionRedisLockTimeout,
      this.getTransactionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Get transaction started.');

        try {
          const paymentsGatewayAxiosService = new PaymentsGatewayAxiosService(
            this.configService,
          );
          const axiosInstance = paymentsGatewayAxiosService.create({});

          logger.debug('Get transactions started.');

          const getTransactionController = new GetTransactionController(
            logger,
            this.transactionRedisRepository,
            this.transactionCurrentPageRedisRepository,
            axiosInstance,
          );

          await getTransactionController.execute();
        } catch (error) {
          logger.error('Error with get transactions.', { error });
        }
      },
    );
  }
}
