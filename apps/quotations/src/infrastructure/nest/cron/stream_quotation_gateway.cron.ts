import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  StreamPairRepository,
  StreamQuotationGatewayRepository,
} from '@zro/quotations/domain';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  CRON_TASKS,
  GetStreamQuotationService,
  LoadGetStreamQuotationService,
  StreamQuotationGatewayRedisRepository,
  OperationServiceKafka,
  StreamPairRedisRepository,
  LoadActiveCurrenciesService,
} from '@zro/quotations/infrastructure';
import { CreateStreamQuotationGatewayController } from '@zro/quotations/interface';

export interface GetStreamQuotationGatewayCronConfig {
  APP_ENV: string;
  APP_STREAM_QUOTATIONS_INTERVAL_MS: number;
  APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
  APP_STREAM_QUOTATIONS_DISABLE_GATEWAYS: string;

  APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_KEY: string;
  APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class GetStreamQuotationGatewayCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Stream pair generic repository.
   */
  private streamPairRepository: StreamPairRepository;

  /**
   * Stream quotation generic repository.
   */
  private streamQuotationGatewayRepository: StreamQuotationGatewayRepository;

  /**
   * Active stream gateways.
   */
  private streamServices: GetStreamQuotationService[] = [];

  /**
   * Coma separated list of forced disabled gateways.
   */
  private disabledGateways: string;

  /**
   * Envs for cron settings
   */
  private syncGatewayStreamQuotationRedisKey: string;
  private syncGatewayStreamQuotationRedisLockTimeout: number;
  private syncGatewayStreamQuotationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<GetStreamQuotationGatewayCronConfig>,
    private readonly redisService: RedisService,
    private readonly loadGetStreamQuotationService: LoadGetStreamQuotationService,
    private readonly loadActiveCurrenciesService: LoadActiveCurrenciesService,
  ) {
    this.logger = logger.child({
      context: GetStreamQuotationGatewayCronService.name,
    });
  }

  /**
   * Initialize select quotation gateway.
   */
  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    // Load all registered stream quotation services.
    this.streamServices =
      await this.loadGetStreamQuotationService.loadServices();

    // Check if none gateway was loaded
    if (!this.streamServices.length) {
      this.logger.info('No stream quotation loaded.');
      return;
    }

    this.disabledGateways = this.configService.get<string>(
      'APP_STREAM_QUOTATIONS_DISABLE_GATEWAYS',
      '',
    );

    const ttl = this.configService.get<number>(
      'APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
      10000,
    );

    const appStreamQuotationsInterval = this.configService.get<number>(
      'APP_STREAM_QUOTATIONS_INTERVAL_MS',
    );

    //Cron redis settings
    this.syncGatewayStreamQuotationRedisKey = this.configService.get<string>(
      'APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_KEY',
    );
    this.syncGatewayStreamQuotationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncGatewayStreamQuotationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appStreamQuotationsInterval ||
      !this.syncGatewayStreamQuotationRedisKey ||
      !this.syncGatewayStreamQuotationRedisLockTimeout ||
      !this.syncGatewayStreamQuotationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appStreamQuotationsInterval
          ? ['APP_STREAM_QUOTATIONS_INTERVAL_MS']
          : []),
        ...(!this.syncGatewayStreamQuotationRedisKey
          ? ['APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_KEY']
          : []),
        ...(!this.syncGatewayStreamQuotationRedisLockTimeout
          ? ['APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncGatewayStreamQuotationRedisRefreshInterval
          ? ['APP_SYNC_GATEWAY_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.streamPairRepository = new StreamPairRedisRepository(
      this.redisService,
    );
    this.streamQuotationGatewayRepository =
      new StreamQuotationGatewayRedisRepository(this.redisService, ttl);

    const enabledStreamServices = this.streamServices.filter(
      (service) =>
        !this.disabledGateways.includes(service.getGateway().getProviderName()),
    );

    // Start all gateways
    for (const service of enabledStreamServices) {
      const gateway = service.getGateway();
      const gatewayName = gateway.getProviderName();

      if (this.disabledGateways.includes(gatewayName)) continue;

      try {
        // Start gateway.
        gateway.start();
      } catch (error) {
        this.logger.error('ERROR starting stream quotation service.', {
          error,
        });
      }
    }

    // Create one interval job for each stream gateway
    enabledStreamServices.forEach((service, index) => {
      const interval = setInterval(
        // Interval routine.
        async (service) => {
          await this.executeGateway(service.getGateway());
        },
        // Interval time.
        appStreamQuotationsInterval,
        service,
      );

      // Add interval job to NestJS scheduler.
      this.schedulerRegistry.addInterval(
        `${CRON_TASKS.STREAM_QUOTATION_GATEWAY}_${index}`,
        interval,
      );
    });
  }

  /**
   * Shutdown quotation service.
   */
  onModuleDestroy() {
    // Delete interval
    this.schedulerRegistry
      .getIntervals()
      .filter((interval) =>
        interval.startsWith(CRON_TASKS.STREAM_QUOTATION_GATEWAY),
      )
      .forEach((interval) => this.schedulerRegistry.deleteInterval(interval));
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async executeGateway(
    gateway: GetStreamQuotationGateway,
  ): Promise<void> {
    const gatewayName = gateway.getProviderName();

    await this.redisService.semaphoreRefresh(
      `${this.syncGatewayStreamQuotationRedisKey}:${gatewayName}`,
      this.syncGatewayStreamQuotationRedisLockTimeout,
      this.syncGatewayStreamQuotationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId, gatewayName });

        const operationService = new OperationServiceKafka(
          logger,
          this.loadActiveCurrenciesService,
        );

        const controller = new CreateStreamQuotationGatewayController(
          logger,
          this.streamQuotationGatewayRepository,
          this.streamPairRepository,
          operationService,
          gateway,
        );

        try {
          // Get quotation from gateway
          const quotations = await controller.execute();

          logger.debug('Quotations created.', { quotations });
        } catch (error) {
          logger.error('Gateway response error.', {
            message: error.message,
            stack: error.stack,
          });
        }
      },
    );
  }
}
