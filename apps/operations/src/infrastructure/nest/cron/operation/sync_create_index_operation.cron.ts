import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  CRON_TASKS,
  OperationModel,
  OperationsIndexDatabaseRepository,
} from '@zro/operations/infrastructure';
import { SyncCreateOperationIndexController } from '@zro/operations/interface';

export interface SyncCreateOperationIndexCronConfig {
  APP_ENV: string;
  APP_SYNC_CREATE_OPERATION_INDEX_CRON: string;

  APP_SYNC_CREATE_OPERATION_INDEX_REDIS_KEY: string;
  APP_SYNC_CREATE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CREATE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncCreateOperationIndexCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncCreateOperationIndexRedisKey: string;
  private syncCreateOperationIndexRedisLockTimeout: number;
  private syncCreateOperationIndexRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncCreateOperationIndexCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncCreateOperationIndexCronService.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncCreateOperationIndexCron = this.configService.get<string>(
      'APP_SYNC_CREATE_OPERATION_INDEX_CRON',
    );

    //Cron redis settings
    this.syncCreateOperationIndexRedisKey = this.configService.get<string>(
      'APP_SYNC_CREATE_OPERATION_INDEX_REDIS_KEY',
    );
    this.syncCreateOperationIndexRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CREATE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncCreateOperationIndexRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CREATE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncCreateOperationIndexCron ||
      !this.syncCreateOperationIndexRedisKey ||
      !this.syncCreateOperationIndexRedisLockTimeout ||
      !this.syncCreateOperationIndexRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncCreateOperationIndexCron
          ? ['APP_SYNC_CREATE_OPERATION_INDEX_CRON']
          : []),
        ...(!this.syncCreateOperationIndexRedisKey
          ? ['APP_SYNC_CREATE_OPERATION_INDEX_REDIS_KEY']
          : []),
        ...(!this.syncCreateOperationIndexRedisLockTimeout
          ? ['APP_SYNC_CREATE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCreateOperationIndexRedisRefreshInterval
          ? ['APP_SYNC_CREATE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncCreateOperationIndexCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_CREATE_INDEX,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_CREATE_INDEX,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncCreateOperationIndexRedisKey,
      this.syncCreateOperationIndexRedisLockTimeout,
      this.syncCreateOperationIndexRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const operationsIndexRepository =
            new OperationsIndexDatabaseRepository();

          const tableName = OperationModel.tableName;

          const syncCreateOperationIndexController =
            new SyncCreateOperationIndexController(
              logger,
              operationsIndexRepository,
              tableName,
            );

          logger.debug('Sync create operation index.');

          await syncCreateOperationIndexController.execute();

          logger.debug('Sync create operation index done.');
        } catch (error) {
          logger.error('Error with sync create operation index.', { error });
        }
      },
    );
  }
}
