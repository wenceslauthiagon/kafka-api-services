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
import { SyncPendingExpiredUserForgotPasswordController } from '@zro/users/interface';
import {
  CRON_TASKS,
  UserForgotPasswordDatabaseRepository,
} from '@zro/users/infrastructure';

export interface SyncPendingExpiredUserForgotPasswordCronConfig {
  APP_ENV: string;
  APP_SYNC_USER_FORGOT_PASSWORD_PENDING_CRON: string;
  APP_SYNC_USER_FORGOT_PASSWORD_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_KEY: string;
  APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncPendingExpiredUserForgotPasswordCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private syncExpiredPendingUserForgotPasswordTimestamp: number;

  /**
   * Envs for cron settings
   */
  private syncUserForgotPasswordPendingRedisKey: string;
  private syncUserForgotPasswordPendingRedisLockTimeout: number;
  private syncUserForgotPasswordPendingRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncPendingExpiredUserForgotPasswordCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredUserForgotPasswordCronService.name,
    });

    this.syncExpiredPendingUserForgotPasswordTimestamp = parseInt(
      this.configService.get<string>(
        'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_TIMESTAMP_CRON',
      ),
    );

    //Cron redis settings
    this.syncUserForgotPasswordPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_KEY',
    );
    this.syncUserForgotPasswordPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncUserForgotPasswordPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncExpiredPendingUserForgotPasswordTimestamp ||
      !this.syncUserForgotPasswordPendingRedisKey ||
      !this.syncUserForgotPasswordPendingRedisLockTimeout ||
      !this.syncUserForgotPasswordPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncExpiredPendingUserForgotPasswordTimestamp
          ? ['APP_SYNC_USER_FORGOT_PASSWORD_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncUserForgotPasswordPendingRedisKey
          ? ['APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncUserForgotPasswordPendingRedisLockTimeout
          ? ['APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncUserForgotPasswordPendingRedisRefreshInterval
          ? ['APP_SYNC_USER_FORGOT_PASSWORD_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncUserForgotPasswordPendingCron = this.configService.get<string>(
      'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_CRON',
    );

    if (!syncUserForgotPasswordPendingCron) {
      throw new MissingEnvVarException(
        'APP_SYNC_USER_FORGOT_PASSWORD_PENDING_CRON',
      );
    }

    const cron = new CronJob(syncUserForgotPasswordPendingCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.USER_FORGOT_PASSWORD.SYNC_PENDING,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.USER_FORGOT_PASSWORD.SYNC_PENDING,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncUserForgotPasswordPendingRedisKey,
      this.syncUserForgotPasswordPendingRedisLockTimeout,
      this.syncUserForgotPasswordPendingRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const userForgotPasswordRepository =
            new UserForgotPasswordDatabaseRepository();

          const syncPendingExpiredUserForgotPasswordController =
            new SyncPendingExpiredUserForgotPasswordController(
              logger,
              userForgotPasswordRepository,
              this.syncExpiredPendingUserForgotPasswordTimestamp,
            );

          logger.debug('Sync pending user forgot password to expired.');

          await syncPendingExpiredUserForgotPasswordController.execute();
        } catch (error) {
          logger.error(
            'Error with sync expired pending user forgot password.',
            {
              error,
            },
          );
        }
      },
    );
  }
}
