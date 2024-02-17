import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  MissingDataException,
  MissingEnvVarException,
  PaginationEntity,
  RedisService,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { System } from '@zro/otc/domain';
import {
  CryptoRemittanceAmountUnderflowException,
  CryptoRemittanceGateway,
  OfflineCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import { QuotationAmountUnderMinAmountException } from '@zro/quotations/application';
import { SyncMarketPendingCryptoOrdersController } from '@zro/otc/interface';
import {
  CRON_TASKS,
  ConversionDatabaseRepository,
  CryptoOrderDatabaseRepository,
  CryptoOrderEventKafkaEmitter,
  CryptoRemittanceDatabaseRepository,
  CryptoRemittanceEventKafkaEmitter,
  ProviderDatabaseRepository,
  QuotationServiceKafka,
  SystemDatabaseRepository,
  OperationServiceKafka,
} from '@zro/otc/infrastructure';
import { B2C2GatewayConfig, B2C2CryptoRemittanceService } from '@zro/b2c2';

export interface SyncMarketPendingCryptoOrdersCronConfig
  extends B2C2GatewayConfig {
  APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_INTERVAL_MS: number;
  APP_SYNC_PENDING_CRYPTO_GET_CURRENCIES_INTERVAL_MS: number;

  APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_KEY: string;
  APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncMarketPendingCryptoOrdersCronService
  implements OnModuleInit, OnModuleDestroy
{
  private cryptoRemittanceGateways: CryptoRemittanceGateway[] = [];
  private systems: System[];
  private cronControl = {};
  private cronControlGetCurrencies = false;
  private appPendingCryptoOrderInterval: number;

  /**
   * Envs for cron settings
   */
  private syncMarketingPendingCryptoOrdersRedisKey: string;
  private syncMarketingPendingCryptoOrdersRedisLockTimeout: number;
  private syncMarketingPendingCryptoOrdersRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<SyncMarketPendingCryptoOrdersCronConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly kafkaService: KafkaService,
    private readonly b2c2CryptoRemittanceService: B2C2CryptoRemittanceService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncMarketPendingCryptoOrdersCronService.name,
    });
  }

  async onModuleInit() {
    this.appPendingCryptoOrderInterval = Number(
      this.configService.get<string>(
        'APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_INTERVAL_MS',
      ),
    );
    const appGetCurrenciesIntervalTimestamp = Number(
      this.configService.get<string>(
        'APP_SYNC_PENDING_CRYPTO_GET_CURRENCIES_INTERVAL_MS',
      ) ?? 5000,
    );

    //Cron redis settings
    this.syncMarketingPendingCryptoOrdersRedisKey =
      this.configService.get<string>(
        'APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_KEY',
      );
    this.syncMarketingPendingCryptoOrdersRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncMarketingPendingCryptoOrdersRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.appPendingCryptoOrderInterval ||
      !this.syncMarketingPendingCryptoOrdersRedisKey ||
      !this.syncMarketingPendingCryptoOrdersRedisLockTimeout ||
      !this.syncMarketingPendingCryptoOrdersRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.appPendingCryptoOrderInterval
          ? ['APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_INTERVAL_MS']
          : []),
        ...(!this.syncMarketingPendingCryptoOrdersRedisKey
          ? ['APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_KEY']
          : []),
        ...(!this.syncMarketingPendingCryptoOrdersRedisLockTimeout
          ? ['APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncMarketingPendingCryptoOrdersRedisRefreshInterval
          ? ['APP_SYNC_MARKETING_PENDING_CRYPTO_ORDERS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.cryptoRemittanceGateways = [
      this.b2c2CryptoRemittanceService.getB2C2CryptoRemittanceGateway(
        this.logger,
      ),
    ];

    const systemRepository = new SystemDatabaseRepository();

    // Save all available systems to handle crypto remittances by system.
    const pagination = new PaginationEntity();
    const systemsPaginated = await systemRepository.getAll(pagination);

    if (!systemsPaginated?.data) {
      throw new MissingDataException(['Systems not found.']);
    }

    this.systems = systemsPaginated.data;

    // Check if the env is test before enabling the interval
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appGetCurrenciesInterval = setInterval(
      async () => await this.loadCron(),
      appGetCurrenciesIntervalTimestamp,
    );

    // Add interval job to NestJS scheduler.
    this.schedulerRegistry.addInterval(
      CRON_TASKS.CRYPTO_ORDER.SYNC_GET_CURRENCIES,
      appGetCurrenciesInterval,
    );
  }

  onModuleDestroy() {
    this.schedulerRegistry
      .getIntervals()
      .filter(
        (interval) =>
          interval.startsWith(CRON_TASKS.CRYPTO_ORDER.SYNC_PENDING) ||
          interval.startsWith(CRON_TASKS.CRYPTO_ORDER.SYNC_GET_CURRENCIES),
      )
      .forEach((interval) => this.schedulerRegistry.deleteInterval(interval));
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async loadCron(): Promise<void> {
    if (this.cronControlGetCurrencies) return;
    this.cronControlGetCurrencies = true;

    try {
      const operationService = new OperationServiceKafka(
        uuidV4(),
        this.logger,
        this.kafkaService,
      );
      const exposedCurrencies = await operationService.getAllActiveCurrencies();

      exposedCurrencies.forEach((currency, index) => {
        const interval = setInterval(
          // Interval routine.
          async (item) => {
            if (this.cronControl[item.symbol]) return;
            this.cronControl[item.symbol] = true;
            await this.execute(item);
            this.cronControl[item.symbol] = false;
          },
          // Interval time.
          this.appPendingCryptoOrderInterval,
          // Interval params.
          currency,
        );

        // Add interval job to NestJS scheduler.
        this.schedulerRegistry.addInterval(
          `${CRON_TASKS.CRYPTO_ORDER.SYNC_PENDING}_${index}`,
          interval,
        );
      });

      this.schedulerRegistry.deleteInterval(
        CRON_TASKS.CRYPTO_ORDER.SYNC_GET_CURRENCIES,
      );
    } catch (error) {
      this.logger.error('Failed to get currencies from operations.', error);
    }

    this.cronControlGetCurrencies = false;
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute(baseCurrency: Currency): Promise<void> {
    await this.redisService.semaphoreRefresh(
      `${this.syncMarketingPendingCryptoOrdersRedisKey}-${baseCurrency.symbol}`,
      this.syncMarketingPendingCryptoOrdersRedisLockTimeout,
      this.syncMarketingPendingCryptoOrdersRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Currency request.', { baseCurrency });

        try {
          const cryptoRemittanceRepository =
            new CryptoRemittanceDatabaseRepository();
          const cryptoOrderRepository = new CryptoOrderDatabaseRepository();
          const providerRepository = new ProviderDatabaseRepository();
          const conversionRepository = new ConversionDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const cryptoOrderEventEmitter = new CryptoOrderEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );
          const cryptoRemittanceEventEmitter =
            new CryptoRemittanceEventKafkaEmitter(requestId, emitter, logger);

          const quotationService = new QuotationServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          const controller = new SyncMarketPendingCryptoOrdersController(
            logger,
            cryptoRemittanceRepository,
            cryptoOrderRepository,
            providerRepository,
            conversionRepository,
            cryptoOrderEventEmitter,
            cryptoRemittanceEventEmitter,
            this.cryptoRemittanceGateways,
            quotationService,
            this.systems,
          );

          await controller.execute({ baseCurrency });

          logger.debug('Sync crypto remittance created.');

          // Fire events.
          await emitter.fireEvents();
        } catch (error) {
          if (
            error instanceof CryptoRemittanceAmountUnderflowException ||
            error instanceof QuotationAmountUnderMinAmountException
          ) {
            // Do not flood logger.
          } else if (error instanceof OfflineCryptoRemittanceGatewayException) {
            // TODO: Send message to slack IT team
            logger.error('The CryptoRemittanceGateway is OFFLINE.');
            throw error;
          } else {
            // TODO: Send message to slack IT team
            logger.error(error.code, { data: error.data, stack: error.stack });
            // Stop this cron.
            this.onModuleDestroy();
            throw error;
          }
        }
      },
    );
  }
}
