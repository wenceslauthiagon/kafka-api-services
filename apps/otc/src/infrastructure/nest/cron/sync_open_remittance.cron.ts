import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  InvalidDataFormatException,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { SettlementDateCode, settlementDateCodes } from '@zro/otc/domain';
import {
  RemittanceCurrentGroupRedisRepository,
  CRON_TASKS,
  RemittanceDatabaseRepository,
  RemittanceOrderRemittanceDatabaseRepository,
  RemittanceEventKafkaEmitter,
  ExchangeQuotationEventKafkaEmitter,
  OperationServiceKafka,
  QuotationServiceKafka,
  UtilServiceKafka,
} from '@zro/otc/infrastructure';
import { SyncOpenRemittanceController } from '@zro/otc/interface';

export interface OpenRemittanceCronConfig {
  APP_SYNC_OPEN_REMITTANCE_CRON: string;
  APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE: string;
  APP_REMITTANCE_PSP_SETTLEMENT_DATE_BY_STARTING_TIME: string;
  APP_REMITTANCE_PSP_MARKET_OPEN_TIME: string;
  APP_REMITTANCE_PSP_MARKET_CLOSE_TIME: string;
  APP_REMITTANCE_PSP_MIN_AMOUNT: number;
  APP_REMITTANCE_PSP_MAX_AMOUNT: number;
  APP_REMITTANCE_PSP_MAX_DAILY_AMOUNT: number;

  APP_SYNC_OPEN_REMITTANCE_REDIS_KEY: string;
  APP_SYNC_OPEN_REMITTANCE_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_OPEN_REMITTANCE_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncOpenRemittanceCronService implements OnModuleInit {
  private readonly remittanceCurrentGroupCacheRepository: RemittanceCurrentGroupRedisRepository;
  private readonly defaultSendDateCode: SettlementDateCode;
  private readonly defaultReceiveDateCode: SettlementDateCode;
  private readonly pspSettlementDateByStartingTime: string;
  private readonly pspMarketOpenTime: string;
  private readonly pspMarketOpenCloseTime: string;
  private readonly pspTradeMinAmount: number;
  private readonly pspTradeMaxAmount: number;
  private readonly pspDailyMaxAmount: number;

  /**
   * Envs for cron settings
   */
  private syncOpenRemittanceRedisKey: string;
  private syncOpenRemittanceRedisLockTimeout: number;
  private syncOpenRemittanceRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<OpenRemittanceCronConfig>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: SyncOpenRemittanceCronService.name,
    });

    const defaultSettlementDate = this.configService.get<string>(
      'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
    );

    this.pspSettlementDateByStartingTime = this.configService.get<string>(
      'APP_REMITTANCE_PSP_SETTLEMENT_DATE_BY_STARTING_TIME',
    );
    this.pspMarketOpenTime = this.configService.get<string>(
      'APP_REMITTANCE_PSP_MARKET_OPEN_TIME',
    );
    this.pspMarketOpenCloseTime = this.configService.get<string>(
      'APP_REMITTANCE_PSP_MARKET_CLOSE_TIME',
    );
    this.pspTradeMinAmount = this.configService.get<number>(
      'APP_REMITTANCE_PSP_MIN_AMOUNT',
    );
    this.pspTradeMaxAmount = this.configService.get<number>(
      'APP_REMITTANCE_PSP_MAX_AMOUNT',
    );
    this.pspDailyMaxAmount = this.configService.get<number>(
      'APP_REMITTANCE_PSP_MAX_DAILY_AMOUNT',
    );

    if (
      !defaultSettlementDate ||
      !this.pspMarketOpenTime ||
      !this.pspMarketOpenCloseTime ||
      !this.pspTradeMinAmount ||
      !this.pspTradeMaxAmount ||
      !this.pspDailyMaxAmount
    ) {
      throw new MissingEnvVarException([
        ...(!defaultSettlementDate
          ? ['APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE']
          : []),
        ...(!!this.pspMarketOpenTime
          ? ['APP_REMITTANCE_PSP_MARKET_OPEN_TIME']
          : []),
        ...(!this.pspMarketOpenCloseTime
          ? ['APP_REMITTANCE_PSP_MARKET_CLOSE_TIME']
          : []),
        ...(!this.pspTradeMinAmount ? ['APP_REMITTANCE_PSP_MIN_AMOUNT'] : []),
        ...(!this.pspTradeMaxAmount ? ['APP_REMITTANCE_PSP_MAX_AMOUNT'] : []),
        ...(!this.pspDailyMaxAmount
          ? ['APP_REMITTANCE_PSP_MAX_DAILY_AMOUNT']
          : []),
      ]);
    }

    const dateCodes = settlementDateCodes(defaultSettlementDate);

    if (!dateCodes) {
      throw new InvalidDataFormatException([
        'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
      ]);
    }

    const [defaultSendDateCode, defaultReceiveDateCode] = dateCodes;
    this.defaultSendDateCode = defaultSendDateCode;
    this.defaultReceiveDateCode = defaultReceiveDateCode;

    this.remittanceCurrentGroupCacheRepository =
      new RemittanceCurrentGroupRedisRepository(this.redisService);
  }

  onModuleInit() {
    const appSyncOpenRemittanceCron = this.configService.get<string>(
      'APP_SYNC_OPEN_REMITTANCE_CRON',
    );

    //Cron redis settings
    this.syncOpenRemittanceRedisKey = this.configService.get<string>(
      'APP_SYNC_OPEN_REMITTANCE_REDIS_KEY',
    );
    this.syncOpenRemittanceRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_OPEN_REMITTANCE_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncOpenRemittanceRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_OPEN_REMITTANCE_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appSyncOpenRemittanceCron ||
      !this.syncOpenRemittanceRedisKey ||
      !this.syncOpenRemittanceRedisLockTimeout ||
      !this.syncOpenRemittanceRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appSyncOpenRemittanceCron
          ? ['APP_SYNC_OPEN_REMITTANCE_CRON']
          : []),
        ...(!this.syncOpenRemittanceRedisKey
          ? ['APP_SYNC_OPEN_REMITTANCE_REDIS_KEY']
          : []),
        ...(!this.syncOpenRemittanceRedisLockTimeout
          ? ['APP_SYNC_OPEN_REMITTANCE_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncOpenRemittanceRedisRefreshInterval
          ? ['APP_SYNC_OPEN_REMITTANCE_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const openRemittanceSync = new CronJob(appSyncOpenRemittanceCron, () =>
      this.syncOpenRemittance(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REMITTANCE.SYNC_OPEN,
      openRemittanceSync,
    );

    openRemittanceSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncOpenRemittance(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncOpenRemittanceRedisKey,
      this.syncOpenRemittanceRedisLockTimeout,
      this.syncOpenRemittanceRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const remittanceRepository = new RemittanceDatabaseRepository();
          const remittanceOrderRemittanceRepository =
            new RemittanceOrderRemittanceDatabaseRepository();

          if (!this.kafkaService) {
            logger.error('Missing kafkaService');
            return;
          }

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const remittanceEventEmitter = new RemittanceEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );
          const exchangeQuotationEventEmitter =
            new ExchangeQuotationEventKafkaEmitter(requestId, emitter, logger);

          const quotationService = new QuotationServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );
          const operationService = new OperationServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );
          const utilService = new UtilServiceKafka(
            uuidV4(),
            this.logger,
            this.kafkaService,
          );

          logger.debug('Sync open remittance started.');

          const controller = new SyncOpenRemittanceController(
            logger,
            this.remittanceCurrentGroupCacheRepository,
            remittanceOrderRemittanceRepository,
            operationService,
            quotationService,
            utilService,
            this.defaultSendDateCode,
            this.defaultReceiveDateCode,
            remittanceRepository,
            remittanceEventEmitter,
            exchangeQuotationEventEmitter,
            this.pspSettlementDateByStartingTime,
            this.pspMarketOpenTime,
            this.pspMarketOpenCloseTime,
            this.pspTradeMinAmount,
            this.pspTradeMaxAmount,
            this.pspDailyMaxAmount,
          );

          await controller.execute();

          // Fire events.
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync open remittance.', { error });
        }
      },
    );
  }
}
