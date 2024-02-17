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
import { SyncUserActiveController } from '@zro/users/interface';
import {
  AddressDatabaseRepository,
  CRON_TASKS,
  OccupationDatabaseRepository,
  OnboardingDatabaseRepository,
  ReportServiceKafka,
  UserDatabaseRepository,
  UserLegalRepresentorDatabaseRepository,
  UserLegalAdditionalInfoDatabaseRepository,
} from '@zro/users/infrastructure';

export interface UserActiveCronConfig {
  APP_ENV: string;
  APP_SYNC_USER_ACTIVE_CRON: string;

  APP_SYNC_USER_ACTIVE_REDIS_KEY: string;
  APP_SYNC_USER_ACTIVE_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_USER_ACTIVE_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class UserActiveCronServiceInit implements OnModuleInit {
  private syncUserActiveCron: string;
  private reportService: ReportServiceKafka;

  /**
   * Envs for cron settings
   */
  private syncUserActiveRedisKey: string;
  private syncUserActiveRedisLockTimeout: number;
  private syncUserActiveRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<UserActiveCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: UserActiveCronServiceInit.name });

    this.syncUserActiveCron = this.configService.get<string>(
      'APP_SYNC_USER_ACTIVE_CRON',
    );

    //Cron redis settings
    this.syncUserActiveRedisKey = this.configService.get<string>(
      'APP_SYNC_USER_ACTIVE_REDIS_KEY',
    );
    this.syncUserActiveRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_USER_ACTIVE_REDIS_LOCK_TIMEOUT'),
    );
    this.syncUserActiveRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_USER_ACTIVE_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncUserActiveRedisKey ||
      !this.syncUserActiveRedisLockTimeout ||
      !this.syncUserActiveRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncUserActiveRedisKey
          ? ['APP_SYNC_USER_ACTIVE_REDIS_KEY']
          : []),
        ...(!this.syncUserActiveRedisLockTimeout
          ? ['APP_SYNC_USER_ACTIVE_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncUserActiveRedisRefreshInterval
          ? ['APP_SYNC_USER_ACTIVE_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.reportService = new ReportServiceKafka(
      uuidV4(),
      this.logger,
      this.kafkaService,
    );
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    if (!this.syncUserActiveCron) {
      throw new MissingEnvVarException('APP_SYNC_USER_ACTIVE_CRON');
    }

    const userSync = new CronJob(this.syncUserActiveCron, () =>
      this.syncActiveUser(),
    );

    this.schedulerRegistry.addCronJob(CRON_TASKS.USER.SYNC_ACTIVE, userSync);

    userSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncActiveUser() {
    await this.redisService.semaphoreRefresh(
      this.syncUserActiveRedisKey,
      this.syncUserActiveRedisLockTimeout,
      this.syncUserActiveRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync active user.');

          const userRepository = new UserDatabaseRepository();
          const addressRepository = new AddressDatabaseRepository();
          const onboardingRepository = new OnboardingDatabaseRepository();
          const userLegalRepresentorRepository =
            new UserLegalRepresentorDatabaseRepository();
          const occupationRepository = new OccupationDatabaseRepository();
          const userLegalAdditionalInfoRepository =
            new UserLegalAdditionalInfoDatabaseRepository();

          const syncUserController = new SyncUserActiveController(
            logger,
            userRepository,
            addressRepository,
            onboardingRepository,
            userLegalRepresentorRepository,
            occupationRepository,
            userLegalAdditionalInfoRepository,
            this.reportService,
          );

          await syncUserController.execute();

          logger.debug('Sync users active successfully.');
        } catch (error) {
          logger.error('Error with sync active users.', error);
        }
      },
    );
  }
}
