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
import { SyncReportsHoldersController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportUserDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsHoldersCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_HOLDERS_CRON: string;

  APP_SYNC_REPORTS_HOLDERS_REDIS_KEY: string;
  APP_SYNC_REPORTS_HOLDERS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_HOLDERS_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_HOLDERS_FILE_NAME: string;
}

@Injectable()
export class SyncReportsHoldersCronServiceInit implements OnModuleInit {
  private reportHolderFileName: string;
  private syncReportsHoldersCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsHoldersRedisKey: string;
  private syncReportsHoldersRedisLockTimeout: number;
  private syncReportsHoldersRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsHoldersCronConfig & EguardianConfig
    >,
    private readonly redisService: RedisService,
    private readonly eguardianService: EguardianReportService,
  ) {
    this.logger = logger.child({
      context: SyncReportsHoldersCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsHoldersCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_HOLDERS_CRON',
    );
    this.syncReportsHoldersRedisKey = this.configService.get<string>(
      'APP_SYNC_REPORTS_HOLDERS_REDIS_KEY',
    );
    this.syncReportsHoldersRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_HOLDERS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsHoldersRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_HOLDERS_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportHolderFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_HOLDERS_FILE_NAME',
    );

    if (
      !this.syncReportsHoldersCron ||
      !this.syncReportsHoldersRedisKey ||
      !this.syncReportsHoldersRedisLockTimeout ||
      !this.syncReportsHoldersRedisRefreshInterval ||
      !this.reportHolderFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsHoldersCron
          ? ['APP_SYNC_REPORTS_HOLDERS_CRON']
          : []),
        ...(!this.syncReportsHoldersRedisKey
          ? ['APP_SYNC_REPORTS_HOLDERS_REDIS_KEY']
          : []),
        ...(!this.syncReportsHoldersRedisLockTimeout
          ? ['APP_SYNC_REPORTS_HOLDERS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsHoldersRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_HOLDERS_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportHolderFileName
          ? ['APP_SYNC_REPORTS_HOLDERS_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsHoldersCron = new CronJob(
      this.syncReportsHoldersCron,
      () => this.syncReportsHolders(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_HOLDER.SYNC,
      syncReportsHoldersCron,
    );

    syncReportsHoldersCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncReportsHolders() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsHoldersRedisKey,
      this.syncReportsHoldersRedisLockTimeout,
      this.syncReportsHoldersRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports holders.');

          const reportUserRepository = new ReportUserDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsHoldersController = new SyncReportsHoldersController(
            logger,
            reportUserRepository,
            eguardianReportGateway,
            this.reportHolderFileName,
          );

          await syncReportsHoldersController.execute();

          logger.debug('Sync reports holders successfully.');
        } catch (error) {
          logger.error('Error with sync report holders.', { error });
        }
      },
    );
  }
}
