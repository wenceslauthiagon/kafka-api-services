import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { SyncUpdateUserLimitTrackerByIntervalController } from '@zro/operations/interface';
import {
  CRON_TASKS,
  OperationDatabaseRepository,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';

export interface UpdateUserLimitTrackerByIntervalCronConfig {
  APP_ENV: string;
  APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_CRON: string;
  APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_KEY: string;
  APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncUpdateUserLimitTrackerByIntervalCronServiceInit
  implements OnModuleInit
{
  private syncUpdateUserLimitTrackerByIntervalCron: string;

  /**
   * Envs for cron settings
   */
  private syncUpdateUserLimitTrackerByIntervalRedisKey: string;
  private syncUpdateUserLimitTrackerByIntervalRedisLockTimeout: number;
  private syncUpdateUserLimitTrackerByIntervalRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<UpdateUserLimitTrackerByIntervalCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncUpdateUserLimitTrackerByIntervalCronServiceInit.name,
    });

    this.syncUpdateUserLimitTrackerByIntervalCron =
      this.configService.get<string>(
        'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_CRON',
      );

    //Cron redis settings
    this.syncUpdateUserLimitTrackerByIntervalRedisKey =
      this.configService.get<string>(
        'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_KEY',
      );
    this.syncUpdateUserLimitTrackerByIntervalRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncUpdateUserLimitTrackerByIntervalRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncUpdateUserLimitTrackerByIntervalCron ||
      !this.syncUpdateUserLimitTrackerByIntervalRedisKey ||
      !this.syncUpdateUserLimitTrackerByIntervalRedisLockTimeout ||
      !this.syncUpdateUserLimitTrackerByIntervalRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncUpdateUserLimitTrackerByIntervalCron
          ? ['APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_CRON']
          : []),
        ...(!this.syncUpdateUserLimitTrackerByIntervalRedisKey
          ? ['APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_KEY']
          : []),
        ...(!this.syncUpdateUserLimitTrackerByIntervalRedisLockTimeout
          ? [
              'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_LOCK_TIMEOUT',
            ]
          : []),
        ...(!this.syncUpdateUserLimitTrackerByIntervalRedisRefreshInterval
          ? [
              'APP_SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL_REDIS_REFRESH_INTERVAL',
            ]
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const updateUserLimitTrackerByIntervalCron = new CronJob(
      this.syncUpdateUserLimitTrackerByIntervalCron,
      () => this.syncUpdateUserLimitTrackerByInterval(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.USER_LIMIT_TRACKER.SYNC_UPDATE_USER_LIMIT_TRACKER_BY_INTERVAL,
      updateUserLimitTrackerByIntervalCron,
    );

    updateUserLimitTrackerByIntervalCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncUpdateUserLimitTrackerByInterval() {
    await this.redisService.semaphoreRefresh(
      this.syncUpdateUserLimitTrackerByIntervalRedisKey,
      this.syncUpdateUserLimitTrackerByIntervalRedisLockTimeout,
      this.syncUpdateUserLimitTrackerByIntervalRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync update user limit tracker.');

          const userLimitTrackerRepository =
            new UserLimitTrackerDatabaseRepository();
          const operationRepository = new OperationDatabaseRepository();

          const syncUpdateUserLimitTrackerByIntervalController =
            new SyncUpdateUserLimitTrackerByIntervalController(
              logger,
              userLimitTrackerRepository,
              operationRepository,
            );

          await syncUpdateUserLimitTrackerByIntervalController.execute();

          logger.debug(
            'Sync update user limit tracker by interval finished successfully.',
          );
        } catch (error) {
          logger.error(
            'Error with sync update user limit tracker by interval.',
            error,
          );
        }
      },
    );
  }
}
