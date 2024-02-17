import { Span } from 'nestjs-otel';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  StreamPairRepository,
  StreamQuotationGatewayRepository,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import {
  CRON_TASKS,
  OperationServiceKafka,
  StreamQuotationGatewayRedisRepository,
  StreamQuotationRedisRepository,
  StreamPairRedisRepository,
  StreamQuotationEventKafkaEmitter,
  LoadActiveCurrenciesService,
} from '@zro/quotations/infrastructure';
import { CreateStreamQuotationController } from '@zro/quotations/interface';

export interface GetStreamQuotationCronConfig {
  APP_ENV: string;
  APP_STREAM_QUOTATIONS_INTERVAL_MS: number;
  APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;

  APP_SYNC_STREAM_QUOTATIONS_REDIS_KEY: string;
  APP_SYNC_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class GetStreamQuotationCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Stream pair generic repository.
   */
  private streamPairRepository: StreamPairRepository;

  /**
   * Stream quotation generic repository.
   */
  private streamQuotationRepository: StreamQuotationRepository;

  /**
   * Stream quotation gateway repository.
   */
  private streamQuotationGatewayRepository: StreamQuotationGatewayRepository;

  /**
   * Envs for cron settings
   */
  private syncStreamQuotationsRedisKey: string;
  private syncStreamQuotationsRedisLockTimeout: number;
  private syncStreamQuotationsRedisRefreshInterval: number;

  /**
   *
   * @param logger
   * @param schedulerRegistry
   * @param configService
   * @param kafkaService
   * @param redisService
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<GetStreamQuotationCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly loadActiveCurrenciesService: LoadActiveCurrenciesService,
  ) {
    this.logger = logger.child({ context: GetStreamQuotationCronService.name });
  }

  /**
   * Initialize select stream quotation.
   */
  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }
    const ttl = this.configService.get<number>(
      'APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
      10000,
    );
    const appStreamQuotationsInterval = this.configService.get<number>(
      'APP_STREAM_QUOTATIONS_INTERVAL_MS',
    );

    //Cron redis settings
    this.syncStreamQuotationsRedisKey = this.configService.get<string>(
      'APP_SYNC_STREAM_QUOTATIONS_REDIS_KEY',
    );
    this.syncStreamQuotationsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncStreamQuotationsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appStreamQuotationsInterval ||
      !this.syncStreamQuotationsRedisKey ||
      !this.syncStreamQuotationsRedisLockTimeout ||
      !this.syncStreamQuotationsRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appStreamQuotationsInterval
          ? ['APP_STREAM_QUOTATIONS_INTERVAL_MS']
          : []),
        ...(!this.syncStreamQuotationsRedisKey
          ? ['APP_SYNC_STREAM_QUOTATIONS_REDIS_KEY']
          : []),
        ...(!this.syncStreamQuotationsRedisLockTimeout
          ? ['APP_SYNC_STREAM_QUOTATIONS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncStreamQuotationsRedisRefreshInterval
          ? ['APP_SYNC_STREAM_QUOTATIONS_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.streamPairRepository = new StreamPairRedisRepository(
      this.redisService,
    );
    this.streamQuotationRepository = new StreamQuotationRedisRepository(
      this.redisService,
      ttl,
    );
    this.streamQuotationGatewayRepository =
      new StreamQuotationGatewayRedisRepository(this.redisService, ttl);

    const interval = setInterval(
      // Interval routine.
      async () => {
        await this.execute();
      },
      // Interval time.
      appStreamQuotationsInterval,
    );

    // Add interval job to NestJS scheduler.
    this.schedulerRegistry.addInterval(CRON_TASKS.STREAM_QUOTATION, interval);
  }

  /**
   * Shutdown quotation service.
   */
  onModuleDestroy() {
    // Delete interval
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteInterval(CRON_TASKS.STREAM_QUOTATION);
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  private async execute(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncStreamQuotationsRedisKey,
      this.syncStreamQuotationsRedisLockTimeout,
      this.syncStreamQuotationsRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        const operationService = new OperationServiceKafka(
          logger,
          this.loadActiveCurrenciesService,
        );

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new StreamQuotationEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        const controller = new CreateStreamQuotationController(
          logger,
          this.streamQuotationGatewayRepository,
          this.streamQuotationRepository,
          this.streamPairRepository,
          operationService,
          serviceEmitter,
        );

        try {
          // Get quotation from gateway
          const quotations = await controller.execute();

          logger.debug('Quotations created.', { quotations });

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Response error.', {
            message: error.message,
            stack: error.stack,
          });
        }
      },
    );
  }
}
