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
import { SyncCardOperationController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface CardOperationCronConfig {
  APP_ENV: string;
  APP_SYNC_CARD_OPERATION_CRON: string;
  APP_CARD_OPERATION_TAGS: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_CURRENCY_TAG: string;

  APP_SYNC_CARD_OPERATION_REDIS_KEY: string;
  APP_SYNC_CARD_OPERATION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CARD_OPERATION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncCardOperationCronServiceInit implements OnModuleInit {
  private syncCardOperationCron: string;
  private cardOperationTags: string;
  private zrobankIspb: string;
  private currencyTag: string;
  private operationService: OperationServiceKafka;

  /**
   * Envs for cron settings
   */
  private syncCardOperationRedisKey: string;
  private syncCardOperationRedisLockTimeout: number;
  private syncCardOperationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<CardOperationCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncCardOperationCronServiceInit.name,
    });

    this.syncCardOperationCron = this.configService.get<string>(
      'APP_SYNC_CARD_OPERATION_CRON',
    );

    this.cardOperationTags = this.configService.get<string>(
      'APP_CARD_OPERATION_TAGS',
    );

    this.zrobankIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    this.currencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );

    //Cron redis settings
    this.syncCardOperationRedisKey = this.configService.get<string>(
      'APP_SYNC_CARD_OPERATION_REDIS_KEY',
    );
    this.syncCardOperationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CARD_OPERATION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncCardOperationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CARD_OPERATION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncCardOperationCron ||
      !this.cardOperationTags ||
      !this.zrobankIspb ||
      !this.currencyTag ||
      !this.syncCardOperationRedisKey ||
      !this.syncCardOperationRedisLockTimeout ||
      !this.syncCardOperationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncCardOperationCron
          ? ['APP_SYNC_CARD_OPERATION_CRON']
          : []),
        ...(!this.cardOperationTags ? ['APP_CARD_OPERATION_TAGS'] : []),
        ...(!this.zrobankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.currencyTag ? ['APP_OPERATION_CURRENCY_TAG'] : []),
        ...(!this.syncCardOperationRedisKey
          ? ['APP_SYNC_CARD_OPERATION_REDIS_KEY']
          : []),
        ...(!this.syncCardOperationRedisLockTimeout
          ? ['APP_SYNC_CARD_OPERATION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCardOperationRedisRefreshInterval
          ? ['APP_SYNC_CARD_OPERATION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.operationService = new OperationServiceKafka(
      uuidV4(),
      this.logger,
      this.kafkaService,
    );
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const cardOperationCron = new CronJob(this.syncCardOperationCron, () =>
      this.syncCardOperation(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.CARD_OPERATION.SYNC,
      cardOperationCron,
    );

    cardOperationCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncCardOperation() {
    await this.redisService.semaphoreRefresh(
      this.syncCardOperationRedisKey,
      this.syncCardOperationRedisLockTimeout,
      this.syncCardOperationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync card operations.');

          const reportOperationRepository =
            new ReportOperationDatabaseRepository();

          const syncCardOperationController = new SyncCardOperationController(
            logger,
            reportOperationRepository,
            this.operationService,
            this.cardOperationTags,
            this.zrobankIspb,
            this.currencyTag,
          );

          await syncCardOperationController.execute();

          logger.debug('Sync card operations successfully.');
        } catch (error) {
          logger.debug('Error', error);
          logger.error('Error with sync card operations.');
        }
      },
    );
  }
}
