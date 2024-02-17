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
  TranslateService,
} from '@zro/common';
import {
  CRON_TASKS,
  PixPaymentServiceKafka,
  PixStatementRedisRepository,
  PixStatementCurrentPageRedisRepository,
  FailedNotifyCreditDatabaseRepository,
} from '@zro/api-topazio/infrastructure';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';
import {
  SyncPixStatementController,
  UpdatePixStatementController,
} from '@zro/api-topazio/interface';

interface PixStatementCronConfig {
  APP_ENV: string;
  APP_SYNC_PIX_STATEMENT_CRON: string;
  APP_UPDATE_PIX_STATEMENT_CRON: string;
  APP_PIX_STATEMENT_DEFAULT_TTL_MS: number;
  APP_ZROBANK_ISPB: string;
  APP_UPDATE_PIX_STATEMENT_END_TO_END_ID_FILTER: string;

  APP_SYNC_PIX_STATEMENT_REDIS_KEY: string;
  APP_SYNC_PIX_STATEMENT_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PIX_STATEMENT_REDIS_REFRESH_INTERVAL: number;

  APP_UPDATE_PIX_STATEMENT_REDIS_KEY: string;
  APP_UPDATE_PIX_STATEMENT_REDIS_LOCK_TIMEOUT: number;
  APP_UPDATE_PIX_STATEMENT_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixStatementCronServiceInit implements OnModuleInit {
  private readonly pixStatementRedisRepository: PixStatementRedisRepository;
  private readonly pixStatementCurrentPageRedisRepository: PixStatementCurrentPageRedisRepository;
  private readonly pixStatementTTL: number;
  private readonly apiTopazioZroBankIspb: string;
  private readonly endToEndIdsFilter: string;

  private readonly syncPixStatementRedisKey: string;
  private readonly syncPixStatementRedisLockTimeout: number;
  private readonly syncPixStatementRedisRefreshInterval: number;
  private readonly updatePixStatementRedisKey: string;
  private readonly updatePixStatementRedisLockTimeout: number;
  private readonly updatePixStatementRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PixStatementCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly translateService: TranslateService,
    private readonly jdpiService: JdpiPixService,
  ) {
    this.logger = logger.child({ context: PixStatementCronServiceInit.name });

    //Default 30 dias em ms - 2592000000
    this.pixStatementTTL = Number(
      this.configService.get<number>(
        'APP_PIX_STATEMENT_DEFAULT_TTL_MS',
        2592000000,
      ),
    );

    this.pixStatementRedisRepository = new PixStatementRedisRepository(
      this.redisService,
      this.pixStatementTTL,
    );

    this.pixStatementCurrentPageRedisRepository =
      new PixStatementCurrentPageRedisRepository(this.redisService);

    this.apiTopazioZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    this.endToEndIdsFilter = this.configService.get<string>(
      'APP_UPDATE_PIX_STATEMENT_END_TO_END_ID_FILTER',
    );

    //Cron redis settings
    this.syncPixStatementRedisKey = this.configService.get<string>(
      'APP_SYNC_PIX_STATEMENT_REDIS_KEY',
    );
    this.syncPixStatementRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_STATEMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPixStatementRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_STATEMENT_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.updatePixStatementRedisKey = this.configService.get<string>(
      'APP_UPDATE_PIX_STATEMENT_REDIS_KEY',
    );
    this.updatePixStatementRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_UPDATE_PIX_STATEMENT_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.updatePixStatementRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_UPDATE_PIX_STATEMENT_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.apiTopazioZroBankIspb ||
      !this.syncPixStatementRedisKey ||
      !this.syncPixStatementRedisLockTimeout ||
      !this.syncPixStatementRedisRefreshInterval ||
      !this.updatePixStatementRedisKey ||
      !this.updatePixStatementRedisLockTimeout ||
      !this.updatePixStatementRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.apiTopazioZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.syncPixStatementRedisKey
          ? ['APP_SYNC_PIX_STATEMENT_REDIS_KEY']
          : []),
        ...(!this.syncPixStatementRedisLockTimeout
          ? ['APP_SYNC_PIX_STATEMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPixStatementRedisRefreshInterval
          ? ['APP_SYNC_PIX_STATEMENT_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.updatePixStatementRedisKey
          ? ['APP_UPDATE_PIX_STATEMENT_REDIS_KEY']
          : []),
        ...(!this.updatePixStatementRedisLockTimeout
          ? ['APP_UPDATE_PIX_STATEMENT_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.updatePixStatementRedisRefreshInterval
          ? ['APP_UPDATE_PIX_STATEMENT_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appSyncPixStatementCron = this.configService.get<string>(
      'APP_SYNC_PIX_STATEMENT_CRON',
    );

    const appUpdatePixStatementCron = this.configService.get<string>(
      'APP_UPDATE_PIX_STATEMENT_CRON',
    );

    if (!appSyncPixStatementCron || !appUpdatePixStatementCron) {
      throw new MissingEnvVarException([
        ...(!appSyncPixStatementCron ? ['APP_SYNC_PIX_STATEMENT_CRON'] : []),
        ...(!appUpdatePixStatementCron
          ? ['APP_UPDATE_PIX_STATEMENT_CRON']
          : []),
      ]);
    }

    const pixStatementSync = new CronJob(appSyncPixStatementCron, () =>
      this.syncPixStatement(),
    );

    const pixStatementUpdate = new CronJob(appUpdatePixStatementCron, () =>
      this.updatePixStatement(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_STATEMENT.SYNC,
      pixStatementSync,
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_STATEMENT.UPDATE,
      pixStatementUpdate,
    );

    pixStatementSync.start();
    pixStatementUpdate.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncPixStatement() {
    await this.redisService.semaphoreRefresh(
      this.syncPixStatementRedisKey,
      this.syncPixStatementRedisLockTimeout,
      this.syncPixStatementRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Sync pixStatement started.');

        try {
          const pixPaymentService = new PixPaymentServiceKafka(
            requestId,
            logger,
            this.kafkaService,
          );

          const failedNotifyCreditRepository =
            new FailedNotifyCreditDatabaseRepository();

          logger.debug('Sync pixStatements started.');

          const syncPixStatementController = new SyncPixStatementController(
            logger,
            pixPaymentService,
            this.pixStatementRedisRepository,
            failedNotifyCreditRepository,
            this.apiTopazioZroBankIspb,
            this.translateService,
          );

          await syncPixStatementController.execute();
        } catch (error) {
          logger.error('Error with sync pix statements.', { error });
        }
      },
    );
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async updatePixStatement() {
    await this.redisService.semaphoreRefresh(
      this.updatePixStatementRedisKey,
      this.updatePixStatementRedisLockTimeout,
      this.updatePixStatementRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        // const pspGateway = this.jdpiService.getPixStatementGateway(logger);

        logger.debug('Update pixStatement started.');

        try {
          logger.debug('Update pixStatements started.');

          const updatePixStatementController = new UpdatePixStatementController(
            logger,
            this.pixStatementRedisRepository,
            this.pixStatementCurrentPageRedisRepository,
            null,
            this.endToEndIdsFilter,
          );

          await updatePixStatementController.execute();
        } catch (error) {
          logger.error('Error with update pix statements.', { error });
        }
      },
    );
  }
}
