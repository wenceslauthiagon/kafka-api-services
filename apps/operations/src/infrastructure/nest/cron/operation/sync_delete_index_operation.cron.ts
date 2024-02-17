import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
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
  CRON_TASKS,
  OperationModel,
  OperationsIndexDatabaseRepository,
} from '@zro/operations/infrastructure';
import { SyncDeleteOperationIndexController } from '@zro/operations/interface';

export interface SyncDeleteOperationIndexCronConfig {
  APP_ENV: string;
  APP_SYNC_DELETE_OPERATION_INDEX_CRON: string;

  APP_SYNC_DELETE_OPERATION_INDEX_REDIS_KEY: string;
  APP_SYNC_DELETE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_DELETE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncDeleteOperationIndexCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncDeleteOperationIndexRedisKey: string;
  private syncDeleteOperationIndexRedisLockTimeout: number;
  private syncDeleteOperationIndexRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncDeleteOperationIndexCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncDeleteOperationIndexCronService.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncDeleteOperationIndexCron = this.configService.get<string>(
      'APP_SYNC_DELETE_OPERATION_INDEX_CRON',
    );

    //Cron redis settings
    this.syncDeleteOperationIndexRedisKey = this.configService.get<string>(
      'APP_SYNC_DELETE_OPERATION_INDEX_REDIS_KEY',
    );
    this.syncDeleteOperationIndexRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_DELETE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncDeleteOperationIndexRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_DELETE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncDeleteOperationIndexCron ||
      !this.syncDeleteOperationIndexRedisKey ||
      !this.syncDeleteOperationIndexRedisLockTimeout ||
      !this.syncDeleteOperationIndexRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncDeleteOperationIndexCron
          ? ['APP_SYNC_DELETE_OPERATION_INDEX_CRON']
          : []),
        ...(!this.syncDeleteOperationIndexRedisKey
          ? ['APP_SYNC_DELETE_OPERATION_INDEX_REDIS_KEY']
          : []),
        ...(!this.syncDeleteOperationIndexRedisLockTimeout
          ? ['APP_SYNC_DELETE_OPERATION_INDEX_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncDeleteOperationIndexRedisRefreshInterval
          ? ['APP_SYNC_DELETE_OPERATION_INDEX_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncDeleteOperationIndexCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.OPERATIONS.SYNC_DELETE_INDEX,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.OPERATIONS.SYNC_DELETE_INDEX,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncDeleteOperationIndexRedisKey,
      this.syncDeleteOperationIndexRedisLockTimeout,
      this.syncDeleteOperationIndexRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const operationsIndexRepository =
            new OperationsIndexDatabaseRepository();

          const tableName = OperationModel.tableName;

          const syncDeleteOperationIndexController =
            new SyncDeleteOperationIndexController(
              logger,
              operationsIndexRepository,
              tableName,
            );

          logger.debug('Sync delete operation index.');

          await syncDeleteOperationIndexController.execute();

          logger.debug('Sync delete operation index done.');
        } catch (error) {
          logger.error('Error with sync delete operation index.', { error });
        }
      },
    );
  }
}
