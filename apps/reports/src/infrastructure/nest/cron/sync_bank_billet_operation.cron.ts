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
import { SyncBankBilletOperationController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface BankBilletOperationCronConfig {
  APP_ENV: string;
  APP_SYNC_BANK_BILLET_OPERATION_CRON: string;
  APP_BANK_BILLET_OPERATION_TAGS: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_CURRENCY_TAG: string;

  APP_SYNC_BANK_BILLET_OPERATION_REDIS_KEY: string;
  APP_SYNC_BANK_BILLET_OPERATION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BANK_BILLET_OPERATION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncBankBilletOperationCronServiceInit implements OnModuleInit {
  private syncBankBilletOperationCron: string;
  private bankBilletOperationTags: string;
  private zrobankIspb: string;
  private currencyTag: string;
  private operationService: OperationServiceKafka;

  /**
   * Envs for cron settings
   */
  private syncBankBilletOperationRedisKey: string;
  private syncBankBilletOperationRedisLockTimeout: number;
  private syncBankBilletOperationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<BankBilletOperationCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncBankBilletOperationCronServiceInit.name,
    });

    this.syncBankBilletOperationCron = this.configService.get<string>(
      'APP_SYNC_BANK_BILLET_OPERATION_CRON',
    );

    this.bankBilletOperationTags = this.configService.get<string>(
      'APP_BANK_BILLET_OPERATION_TAGS',
    );

    this.zrobankIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    this.currencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );

    //Cron redis settings
    this.syncBankBilletOperationRedisKey = this.configService.get<string>(
      'APP_SYNC_BANK_BILLET_OPERATION_REDIS_KEY',
    );
    this.syncBankBilletOperationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_BANK_BILLET_OPERATION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncBankBilletOperationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_BANK_BILLET_OPERATION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncBankBilletOperationCron ||
      !this.bankBilletOperationTags ||
      !this.zrobankIspb ||
      !this.currencyTag ||
      !this.syncBankBilletOperationRedisKey ||
      !this.syncBankBilletOperationRedisLockTimeout ||
      !this.syncBankBilletOperationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncBankBilletOperationCron
          ? ['APP_SYNC_BANK_BILLET_OPERATION_CRON']
          : []),
        ...(!this.bankBilletOperationTags
          ? ['APP_BANK_BILLET_OPERATION_TAGS']
          : []),
        ...(!this.zrobankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.currencyTag ? ['APP_OPERATION_CURRENCY_TAG'] : []),
        ...(!this.syncBankBilletOperationRedisKey
          ? ['APP_SYNC_BANK_BILLET_OPERATION_REDIS_KEY']
          : []),
        ...(!this.syncBankBilletOperationRedisLockTimeout
          ? ['APP_SYNC_BANK_BILLET_OPERATION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBankBilletOperationRedisRefreshInterval
          ? ['APP_SYNC_BANK_BILLET_OPERATION_REDIS_REFRESH_INTERVAL']
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

    const bankBilletOperationCron = new CronJob(
      this.syncBankBilletOperationCron,
      () => this.syncBankBilletOperation(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.BANK_BILLET_OPERATION.SYNC,
      bankBilletOperationCron,
    );

    bankBilletOperationCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncBankBilletOperation() {
    await this.redisService.semaphoreRefresh(
      this.syncBankBilletOperationRedisKey,
      this.syncBankBilletOperationRedisLockTimeout,
      this.syncBankBilletOperationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync bankBillet operations.');

          const reportOperationRepository =
            new ReportOperationDatabaseRepository();

          const syncBankBilletOperationController =
            new SyncBankBilletOperationController(
              logger,
              reportOperationRepository,
              this.operationService,
              this.bankBilletOperationTags,
              this.zrobankIspb,
              this.currencyTag,
            );

          await syncBankBilletOperationController.execute();

          logger.debug('Sync bank billet operations successfully.');
        } catch (error) {
          logger.error('Error with sync bank billet operations.', error);
        }
      },
    );
  }
}
