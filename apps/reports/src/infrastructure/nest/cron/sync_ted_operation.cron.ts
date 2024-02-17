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
import { SyncTedOperationController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  OperationServiceKafka,
  BankingServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface TedOperationCronConfig {
  APP_ENV: string;
  APP_SYNC_TED_OPERATION_CRON: string;
  APP_TED_OPERATION_TAGS: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_CURRENCY_TAG: string;
  APP_TED_RECEIVE_TAG: string;
  APP_TED_SENT_TAG: string;

  APP_SYNC_TED_OPERATION_REDIS_KEY: string;
  APP_SYNC_TED_OPERATION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_TED_OPERATION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncTedOperationCronServiceInit implements OnModuleInit {
  private syncTedOperationCron: string;
  private tedOperationTags: string;
  private zrobankIspb: string;
  private currencyTag: string;
  private tedReceiveTag: string;
  private tedSentTag: string;
  private operationService: OperationServiceKafka;
  private bankingService: BankingServiceKafka;

  /**
   * Envs for cron settings
   */
  private syncTedOperationRedisKey: string;
  private syncTedOperationRedisLockTimeout: number;
  private syncTedOperationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<TedOperationCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncTedOperationCronServiceInit.name,
    });

    this.syncTedOperationCron = this.configService.get<string>(
      'APP_SYNC_TED_OPERATION_CRON',
    );

    this.tedOperationTags = this.configService.get<string>(
      'APP_TED_OPERATION_TAGS',
    );

    this.zrobankIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    this.currencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );

    this.tedReceiveTag = this.configService.get<string>('APP_TED_RECEIVE_TAG');

    this.tedSentTag = this.configService.get<string>('APP_TED_SENT_TAG');

    //Cron redis settings
    this.syncTedOperationRedisKey = this.configService.get<string>(
      'APP_SYNC_TED_OPERATION_REDIS_KEY',
    );
    this.syncTedOperationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_TED_OPERATION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncTedOperationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_TED_OPERATION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncTedOperationCron ||
      !this.tedOperationTags ||
      !this.zrobankIspb ||
      !this.currencyTag ||
      !this.tedReceiveTag ||
      !this.tedSentTag ||
      !this.syncTedOperationRedisKey ||
      !this.syncTedOperationRedisLockTimeout ||
      !this.syncTedOperationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncTedOperationCron ? ['APP_SYNC_TED_OPERATION_CRON'] : []),
        ...(!this.tedOperationTags ? ['APP_TED_OPERATION_TAGS'] : []),
        ...(!this.zrobankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.currencyTag ? ['APP_OPERATION_CURRENCY_TAG'] : []),
        ...(!this.tedReceiveTag ? ['APP_TED_RECEIVE_TAG'] : []),
        ...(!this.syncTedOperationRedisKey
          ? ['APP_SYNC_TED_OPERATION_REDIS_KEY']
          : []),
        ...(!this.syncTedOperationRedisLockTimeout
          ? ['APP_SYNC_TED_OPERATION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncTedOperationRedisRefreshInterval
          ? ['APP_SYNC_TED_OPERATION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.operationService = new OperationServiceKafka(
      uuidV4(),
      this.logger,
      this.kafkaService,
    );

    this.bankingService = new BankingServiceKafka(
      uuidV4(),
      this.logger,
      this.kafkaService,
    );
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const tedOperationCron = new CronJob(this.syncTedOperationCron, () =>
      this.syncTedOperation(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.TED_OPERATION.SYNC,
      tedOperationCron,
    );

    tedOperationCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncTedOperation() {
    await this.redisService.semaphoreRefresh(
      this.syncTedOperationRedisKey,
      this.syncTedOperationRedisLockTimeout,
      this.syncTedOperationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync ted operations.');

          const reportOperationRepository =
            new ReportOperationDatabaseRepository();

          const syncTedOperationController = new SyncTedOperationController(
            logger,
            reportOperationRepository,
            this.operationService,
            this.bankingService,
            this.tedOperationTags,
            this.zrobankIspb,
            this.currencyTag,
            this.tedReceiveTag,
            this.tedSentTag,
          );

          await syncTedOperationController.execute();

          logger.debug('Sync ted operations successfully.');
        } catch (error) {
          logger.error('Error with sync ted operations.', error);
        }
      },
    );
  }
}
