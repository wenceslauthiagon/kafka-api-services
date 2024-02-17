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
import { SyncReportsUserConfigsController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportUserConfigDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsUserConfigsCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_USER_CONFIGS_CRON: string;

  APP_SYNC_REPORTS_USER_CONFIGS_REDIS_KEY: string;
  APP_SYNC_REPORTS_USER_CONFIGS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_USER_CONFIGS_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_USER_CONFIGS_FILE_NAME: string;
}

@Injectable()
export class SyncReportsUserConfigsCronServiceInit implements OnModuleInit {
  private reportUserConfigsFileName: string;
  private syncReportsUserConfigsCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsUserConfigsRedisKey: string;
  private syncReportsUserConfigsRedisLockTimeout: number;
  private syncReportsUserConfigsRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsUserConfigsCronConfig & EguardianConfig
    >,
    private readonly eguardianService: EguardianReportService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncReportsUserConfigsCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsUserConfigsCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_USER_CONFIGS_CRON',
    );
    this.syncReportsUserConfigsRedisKey = this.configService.get<string>(
      'APP_SYNC_REPORTS_USER_CONFIGS_REDIS_KEY',
    );
    this.syncReportsUserConfigsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USER_CONFIGS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsUserConfigsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USER_CONFIGS_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportUserConfigsFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_USER_CONFIGS_FILE_NAME',
    );

    if (
      !this.syncReportsUserConfigsCron ||
      !this.syncReportsUserConfigsRedisKey ||
      !this.syncReportsUserConfigsRedisLockTimeout ||
      !this.syncReportsUserConfigsRedisRefreshInterval ||
      !this.reportUserConfigsFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsUserConfigsCron
          ? ['APP_SYNC_REPORTS_USER_CONFIGS_CRON']
          : []),
        ...(!this.syncReportsUserConfigsRedisKey
          ? ['APP_SYNC_REPORTS_USER_CONFIGS_REDIS_KEY']
          : []),
        ...(!this.syncReportsUserConfigsRedisLockTimeout
          ? ['APP_SYNC_REPORTS_USER_CONFIGS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsUserConfigsRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_USER_CONFIGS_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportUserConfigsFileName
          ? ['APP_SYNC_REPORTS_USER_CONFIGS_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsUserConfigsCron = new CronJob(
      this.syncReportsUserConfigsCron,
      () => this.syncReportsUserConfigs(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_USER_CONFIG.SYNC,
      syncReportsUserConfigsCron,
    );

    syncReportsUserConfigsCron.start();
  }
  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncReportsUserConfigs() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsUserConfigsRedisKey,
      this.syncReportsUserConfigsRedisLockTimeout,
      this.syncReportsUserConfigsRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports user configs.');

          const reportUserConfigRepository =
            new ReportUserConfigDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsUserConfigsController =
            new SyncReportsUserConfigsController(
              logger,
              reportUserConfigRepository,
              eguardianReportGateway,
              this.reportUserConfigsFileName,
            );

          await syncReportsUserConfigsController.execute();

          logger.debug('Sync reports user configs successfully.');
        } catch (error) {
          logger.error('Error with sync report user configs.', { error });
        }
      },
    );
  }
}
