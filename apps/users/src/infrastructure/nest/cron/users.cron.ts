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
import { SyncUserController } from '@zro/users/interface';
import { CRON_TASKS, UserDatabaseRepository } from '@zro/users/infrastructure';

export interface UserCronConfig {
  APP_ENV: string;
  APP_SYNC_USER_CRON: string;
  APP_SYNC_USER_EXPIRATION_IN_MINUTES: number;

  APP_SYNC_USER_REDIS_KEY: string;
  APP_SYNC_USER_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_USER_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class UserCronServiceInit implements OnModuleInit {
  private signupExpirationInMinutes: number;
  private syncUserCron: string;

  /**
   * Envs for cron settings
   */
  private syncUserRedisKey: string;
  private syncUserRedisLockTimeout: number;
  private syncUserRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<UserCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: UserCronServiceInit.name });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.signupExpirationInMinutes = this.configService.get<number>(
      'APP_SYNC_USER_EXPIRATION_IN_MINUTES',
    );
    this.syncUserCron = this.configService.get<string>('APP_SYNC_USER_CRON');

    //Cron redis settings
    this.syncUserRedisKey = this.configService.get<string>(
      'APP_SYNC_USER_REDIS_KEY',
    );
    this.syncUserRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_USER_REDIS_LOCK_TIMEOUT'),
    );
    this.syncUserRedisRefreshInterval = Number(
      this.configService.get<number>('APP_SYNC_USER_REDIS_REFRESH_INTERVAL'),
    );

    if (
      !this.signupExpirationInMinutes ||
      !this.syncUserCron ||
      !this.syncUserRedisKey ||
      !this.syncUserRedisLockTimeout ||
      !this.syncUserRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.signupExpirationInMinutes
          ? ['APP_SYNC_USER_EXPIRATION_IN_MINUTES']
          : []),
        ...(!this.syncUserCron ? ['APP_SYNC_USER_CRON'] : []),
        ...(!this.syncUserRedisKey ? ['APP_SYNC_USER_REDIS_KEY'] : []),
        ...(!this.syncUserRedisLockTimeout
          ? ['APP_SYNC_USER_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncUserRedisRefreshInterval
          ? ['APP_SYNC_USER_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const userSync = new CronJob(this.syncUserCron, () => this.syncUser());

    this.schedulerRegistry.addCronJob(CRON_TASKS.USER.SYNC, userSync);

    userSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncUser() {
    await this.redisService.semaphoreRefresh(
      this.syncUserRedisKey,
      this.syncUserRedisLockTimeout,
      this.syncUserRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync user to update.');

          const userRepository = new UserDatabaseRepository();

          const syncUserController = new SyncUserController(
            logger,
            userRepository,
            this.signupExpirationInMinutes,
          );

          await syncUserController.execute();

          logger.debug('Sync users successfully.');
        } catch (error) {
          logger.error('Error with sync users.');
        }
      },
    );
  }
}
