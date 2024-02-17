import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  InjectLogger,
  MissingEnvVarException,
  PrometheusService,
  RedisService,
} from '@zro/common';
import {
  QuotationTrendRepository,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { SyncCurrencyStreamQuotationController } from '@zro/quotations/interface';
import {
  CRON_TASKS,
  LoadActiveCurrenciesService,
  OperationServiceKafka,
  QuotationTrendPrometheusRepository,
  StreamQuotationRedisRepository,
} from '@zro/quotations/infrastructure';

export interface SyncCurrencyStreamQuotationCronConfig {
  APP_ENV: string;
  APP_OPERATION_CURRENCY_SYMBOL: string;
  APP_SYNC_CURRENCY_STREAM_QUOTATIONS_INTERVAL_MS: number;

  APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_KEY: string;
  APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncCurrencyStreamQuotationCronService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly operationCurrencySymbol: string;

  /**
   * Quotation trend repository.
   */
  private quotationTrendRepository: QuotationTrendRepository;

  /**
   * Stream quotation cache repository.
   */
  private streamQuotationRepository: StreamQuotationRepository;

  /**
   * Envs for cron settings
   */
  private syncCurrencyStreamQuotationsRedisKey: string;
  private syncCurrencyStreamQuotationsRedisLockTimeout: number;
  private syncCurrencyStreamQuotationsRedisRefreshInterval: number;

  /**
   *
   * @param logger
   * @param schedulerRegistry
   * @param configService
   * @param kafkaService
   * @param redisService
   * @param prometheusService
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncCurrencyStreamQuotationCronConfig>,
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    private readonly loadActiveCurrenciesService: LoadActiveCurrenciesService,
  ) {
    this.logger = logger.child({
      context: SyncCurrencyStreamQuotationCronService.name,
    });
    this.operationCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_SYMBOL',
    );
  }

  /**
   * Initialize select sync stream quotation.
   */
  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    const appStreamQuotationsInterval = this.configService.get<number>(
      'APP_SYNC_CURRENCY_STREAM_QUOTATIONS_INTERVAL_MS',
    );

    //Cron redis settings
    this.syncCurrencyStreamQuotationsRedisKey = this.configService.get<string>(
      'APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_KEY',
    );
    this.syncCurrencyStreamQuotationsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncCurrencyStreamQuotationsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.operationCurrencySymbol ||
      !appStreamQuotationsInterval ||
      !this.syncCurrencyStreamQuotationsRedisKey ||
      !this.syncCurrencyStreamQuotationsRedisLockTimeout ||
      !this.syncCurrencyStreamQuotationsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.operationCurrencySymbol
          ? ['APP_OPERATION_CURRENCY_SYMBOL']
          : []),
        ...(!appStreamQuotationsInterval
          ? ['APP_SYNC_CURRENCY_STREAM_QUOTATIONS_INTERVAL_MS']
          : []),
        ...(!this.syncCurrencyStreamQuotationsRedisKey
          ? ['APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_KEY']
          : []),
        ...(!this.syncCurrencyStreamQuotationsRedisLockTimeout
          ? ['APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCurrencyStreamQuotationsRedisRefreshInterval
          ? ['APP_SYNC_CURRENCY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.quotationTrendRepository = new QuotationTrendPrometheusRepository(
      this.prometheusService,
    );
    this.streamQuotationRepository = new StreamQuotationRedisRepository(
      this.redisService,
    );

    const interval = setInterval(
      // Interval routine.
      async () => {
        await this.execute();
      },
      // Interval time.
      appStreamQuotationsInterval,
    );

    // Add interval job to NestJS scheduler.
    this.schedulerRegistry.addInterval(
      CRON_TASKS.SYNC_CURRENCY_STREAM_QUOTATION,
      interval,
    );
  }

  /**
   * Shutdown quotation service.
   */
  onModuleDestroy() {
    // Delete interval
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteInterval(
        CRON_TASKS.SYNC_CURRENCY_STREAM_QUOTATION,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncCurrencyStreamQuotationsRedisKey,
      this.syncCurrencyStreamQuotationsRedisLockTimeout,
      this.syncCurrencyStreamQuotationsRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        const operationService = new OperationServiceKafka(
          logger,
          this.loadActiveCurrenciesService,
        );

        const controller = new SyncCurrencyStreamQuotationController(
          logger,
          this.streamQuotationRepository,
          this.quotationTrendRepository,
          operationService,
          this.operationCurrencySymbol,
        );

        // Sync quotation
        await controller.execute();

        logger.debug('Sync quotations done.');
      },
    );
  }
}
