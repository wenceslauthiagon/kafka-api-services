import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  InvalidDataFormatException,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  RemittanceOrderCurrentGroupRedisRepository,
  CRON_TASKS,
  RemittanceOrderDatabaseRepository,
  RemittanceExposureRuleDatabaseRepository,
  RemittanceDatabaseRepository,
  RemittanceOrderRemittanceDatabaseRepository,
  RemittanceOrderEventKafkaEmitter,
  RemittanceEventKafkaEmitter,
} from '@zro/otc/infrastructure';
import { SyncCreateRemittanceController } from '@zro/otc/interface';
import { SettlementDateCode, settlementDateCodes } from '@zro/otc/domain';

export interface CreateRemittanceCronConfig {
  APP_SYNC_CREATE_REMITTANCE_CRON: string;
  APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE: string;

  APP_SYNC_CREATE_REMITTANCE_REDIS_KEY: string;
  APP_SYNC_CREATE_REMITTANCE_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CREATE_REMITTANCE_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncCreateRemittanceCronService implements OnModuleInit {
  private readonly remittanceOrderCurrentGroupCacheRepository: RemittanceOrderCurrentGroupRedisRepository;
  private readonly defaultSendDateCode: SettlementDateCode;
  private readonly defaultReceiveDateCode: SettlementDateCode;

  /**
   * Envs for cron settings
   */
  private syncCreateRemittanceRedisKey: string;
  private syncCreateRemittanceRedisLockTimeout: number;
  private syncCreateRemittanceRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<CreateRemittanceCronConfig>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: SyncCreateRemittanceCronService.name,
    });

    const defaultSettlementDate = this.configService.get<string>(
      'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
    );

    if (!defaultSettlementDate) {
      throw new MissingEnvVarException([
        'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
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

    this.remittanceOrderCurrentGroupCacheRepository =
      new RemittanceOrderCurrentGroupRedisRepository(this.redisService);
  }

  onModuleInit() {
    const appSyncCreateRemittanceCron = this.configService.get<string>(
      'APP_SYNC_CREATE_REMITTANCE_CRON',
    );

    //Cron redis settings
    this.syncCreateRemittanceRedisKey = this.configService.get<string>(
      'APP_SYNC_CREATE_REMITTANCE_REDIS_KEY',
    );
    this.syncCreateRemittanceRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CREATE_REMITTANCE_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncCreateRemittanceRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CREATE_REMITTANCE_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !appSyncCreateRemittanceCron ||
      !this.syncCreateRemittanceRedisKey ||
      !this.syncCreateRemittanceRedisLockTimeout ||
      !this.syncCreateRemittanceRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!appSyncCreateRemittanceCron
          ? ['APP_SYNC_CREATE_REMITTANCE_CRON']
          : []),
        ...(!this.syncCreateRemittanceRedisKey
          ? ['APP_SYNC_CREATE_REMITTANCE_REDIS_KEY']
          : []),
        ...(!this.syncCreateRemittanceRedisLockTimeout
          ? ['APP_SYNC_CREATE_REMITTANCE_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCreateRemittanceRedisRefreshInterval
          ? ['APP_SYNC_CREATE_REMITTANCE_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const createRemittanceSync = new CronJob(appSyncCreateRemittanceCron, () =>
      this.syncCreateRemittance(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REMITTANCE.SYNC_CREATE,
      createRemittanceSync,
    );

    createRemittanceSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncCreateRemittance(): Promise<void> {
    await this.redisService.semaphoreRefresh(
      this.syncCreateRemittanceRedisKey,
      this.syncCreateRemittanceRedisLockTimeout,
      this.syncCreateRemittanceRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const remittanceOrderRepository =
            new RemittanceOrderDatabaseRepository();
          const remittanceExposureRuleRepository =
            new RemittanceExposureRuleDatabaseRepository();
          const remittanceRepository = new RemittanceDatabaseRepository();
          const remittanceOrderRemittanceRepository =
            new RemittanceOrderRemittanceDatabaseRepository();

          if (!this.kafkaService) {
            logger.error('Missing kafkaService');
            return;
          }

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const remittanceOrderEventEmitter =
            new RemittanceOrderEventKafkaEmitter(requestId, emitter, logger);
          const remittanceEventEmitter = new RemittanceEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          logger.debug('Sync create remittance started.');

          const controller = new SyncCreateRemittanceController(
            logger,
            remittanceOrderRepository,
            this.remittanceOrderCurrentGroupCacheRepository,
            this.defaultSendDateCode,
            this.defaultReceiveDateCode,
            remittanceExposureRuleRepository,
            remittanceRepository,
            remittanceOrderEventEmitter,
            remittanceEventEmitter,
            remittanceOrderRemittanceRepository,
          );

          await controller.execute();

          // Fire events.
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync create remittance.', {
            error,
          });
        }
      },
    );
  }
}
