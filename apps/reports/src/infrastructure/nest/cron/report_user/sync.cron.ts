import { Span } from 'nestjs-otel';
import { v4 as uuidV4 } from 'uuid';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { EguardianConfig, EguardianReportService } from '@zro/e-guardian';
import { SyncReportsUsersController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportUserDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsUsersCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_USERS_CRON: string;

  APP_SYNC_REPORTS_USERS_REDIS_KEY: string;
  APP_SYNC_REPORTS_USERS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_USERS_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_USERS_FILE_NAME: string;
}

@Injectable()
export class SyncReportsUsersCronServiceInit implements OnModuleInit {
  private reportUserFileName: string;
  private syncReportsUsersCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsUsersRedisKey: string;
  private syncReportsUsersRedisLockTimeout: number;
  private syncReportsUsersRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsUsersCronConfig & EguardianConfig
    >,
    private readonly eguardianService: EguardianReportService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncReportsUsersCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsUsersCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_USERS_CRON',
    );
    this.syncReportsUsersRedisKey = this.configService.get<string>(
      'APP_SYNC_REPORTS_USERS_REDIS_KEY',
    );
    this.syncReportsUsersRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USERS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsUsersRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USERS_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportUserFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_USERS_FILE_NAME',
    );

    if (
      !this.syncReportsUsersCron ||
      !this.syncReportsUsersRedisKey ||
      !this.syncReportsUsersRedisLockTimeout ||
      !this.syncReportsUsersRedisRefreshInterval ||
      !this.reportUserFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsUsersCron ? ['APP_SYNC_REPORTS_USERS_CRON'] : []),
        ...(!this.syncReportsUsersRedisKey
          ? ['APP_SYNC_REPORTS_USERS_REDIS_KEY']
          : []),
        ...(!this.syncReportsUsersRedisLockTimeout
          ? ['APP_SYNC_REPORTS_USERS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsUsersRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_USERS_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportUserFileName
          ? ['APP_SYNC_REPORTS_USERS_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsUsersCron = new CronJob(this.syncReportsUsersCron, () =>
      this.syncReportsUsers(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_USER.SYNC,
      syncReportsUsersCron,
    );

    syncReportsUsersCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncReportsUsers() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsUsersRedisKey,
      this.syncReportsUsersRedisLockTimeout,
      this.syncReportsUsersRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports users.');

          const reportUserRepository = new ReportUserDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsUsersController = new SyncReportsUsersController(
            logger,
            reportUserRepository,
            eguardianReportGateway,
            this.reportUserFileName,
          );

          await syncReportsUsersController.execute();

          logger.debug('Sync reports users successfully.');
        } catch (error) {
          logger.error('Error with sync report users.', { error });
        }
      },
    );
  }
}
