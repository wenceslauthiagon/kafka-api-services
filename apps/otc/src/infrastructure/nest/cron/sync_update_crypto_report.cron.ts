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
  CryptoReportCurrentPageRedisRepository,
  CRON_TASKS,
  CryptoReportDatabaseRepository,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import { SyncUpdateCryptoReportController } from '@zro/otc/interface';
import {
  MercadoBitcoinAxiosPublicService,
  MercadoBitcoinGatewayConfig,
  MercadoBitcoinHistoricalCryptoPriceService,
} from '@zro/mercado-bitcoin';

export interface UpdateCryptoReportCronConfig {
  APP_SYNC_UPDATE_CRYPTO_REPORT_CRON: string;
  APP_SYNC_UPDATE_CRYPTO_REPORT_PAGE_SIZE: number;

  APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_KEY: string;
  APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class UpdateCryptoReportCronServiceInit implements OnModuleInit {
  private cryptoReportCurrentPageCacheRepository: CryptoReportCurrentPageRedisRepository;
  private pageSize: number;

  /**
   * Envs for cron settings
   */
  private syncUpdateCryptoReportRedisKey: string;
  private syncUpdateCryptoReportRedisLockTimeout: number;
  private syncUpdateCryptoReportRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      UpdateCryptoReportCronConfig & MercadoBitcoinGatewayConfig
    >,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateCryptoReportCronServiceInit.name,
    });
  }

  async onModuleInit() {
    this.pageSize = this.configService.get<number>(
      'APP_SYNC_UPDATE_CRYPTO_REPORT_PAGE_SIZE',
    );

    // Cron redis settings
    this.syncUpdateCryptoReportRedisKey = this.configService.get<string>(
      'APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_KEY',
    );
    this.syncUpdateCryptoReportRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncUpdateCryptoReportRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.pageSize ||
      !this.syncUpdateCryptoReportRedisKey ||
      !this.syncUpdateCryptoReportRedisLockTimeout ||
      !this.syncUpdateCryptoReportRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.pageSize ? ['APP_SYNC_UPDATE_CRYPTO_REPORT_PAGE_SIZE'] : []),
        ...(!this.syncUpdateCryptoReportRedisKey
          ? ['APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_KEY']
          : []),
        ...(!this.syncUpdateCryptoReportRedisLockTimeout
          ? ['APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncUpdateCryptoReportRedisRefreshInterval
          ? ['APP_SYNC_UPDATE_CRYPTO_REPORT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.cryptoReportCurrentPageCacheRepository =
      new CryptoReportCurrentPageRedisRepository(this.redisService);

    const appSyncUpdateCryptoReportCron = this.configService.get<string>(
      'APP_SYNC_UPDATE_CRYPTO_REPORT_CRON',
    );

    if (!appSyncUpdateCryptoReportCron) {
      throw new MissingEnvVarException(['APP_SYNC_UPDATE_CRYPTO_REPORT_CRON']);
    }

    const updateCryptoReportSync = new CronJob(
      appSyncUpdateCryptoReportCron,
      () => this.syncUpdateCryptoReport(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.CRYPTO_REPORT.SYNC_UPDATE,
      updateCryptoReportSync,
    );

    updateCryptoReportSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncUpdateCryptoReport(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncUpdateCryptoReportRedisKey,
      this.syncUpdateCryptoReportRedisLockTimeout,
      this.syncUpdateCryptoReportRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const cryptoReportRepository = new CryptoReportDatabaseRepository();

          const historicalCryptoPriceAxios =
            new MercadoBitcoinAxiosPublicService(logger);

          const historicalCryptoPriceService =
            new MercadoBitcoinHistoricalCryptoPriceService(
              logger,
              this.configService,
              historicalCryptoPriceAxios,
            );

          const historicalCryptoPriceGateway =
            historicalCryptoPriceService.getMercadoBitcoinHistoricalCryptoPriceGateway(
              logger,
            );

          const operationService = new OperationServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          const quotationService = new QuotationServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          logger.debug('Sync update crypto report started.');

          const controller = new SyncUpdateCryptoReportController(
            logger,
            cryptoReportRepository,
            this.cryptoReportCurrentPageCacheRepository,
            historicalCryptoPriceGateway,
            operationService,
            quotationService,
            this.pageSize,
          );

          await controller.execute();
        } catch (error) {
          logger.error('Error with sync update crypto report.', { error });
        }
      },
    );
  }
}
