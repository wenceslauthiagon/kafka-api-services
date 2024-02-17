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
import { SyncReportsUserLegalRepresentorController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportUserLegalRepresentorDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsUserLegalRepresentorCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_CRON: string;

  APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_KEY: string;
  APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_FILE_NAME: string;
}

@Injectable()
export class SyncReportsUserLegalRepresentorCronServiceInit
  implements OnModuleInit
{
  private reportUserLegalRepresentorFileName: string;
  private syncReportsUserLegalRepresentorCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsUserLegalRepresentorRedisKey: string;
  private syncReportsUserLegalRepresentorRedisLockTimeout: number;
  private syncReportsUserLegalRepresentorRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsUserLegalRepresentorCronConfig & EguardianConfig
    >,
    private readonly eguardianService: EguardianReportService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncReportsUserLegalRepresentorCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsUserLegalRepresentorCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_CRON',
    );
    this.syncReportsUserLegalRepresentorRedisKey =
      this.configService.get<string>(
        'APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_KEY',
      );
    this.syncReportsUserLegalRepresentorRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsUserLegalRepresentorRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportUserLegalRepresentorFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_FILE_NAME',
    );

    if (
      !this.syncReportsUserLegalRepresentorCron ||
      !this.syncReportsUserLegalRepresentorRedisKey ||
      !this.syncReportsUserLegalRepresentorRedisLockTimeout ||
      !this.syncReportsUserLegalRepresentorRedisRefreshInterval ||
      !this.reportUserLegalRepresentorFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsUserLegalRepresentorCron
          ? ['APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_CRON']
          : []),
        ...(!this.syncReportsUserLegalRepresentorRedisKey
          ? ['APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_KEY']
          : []),
        ...(!this.syncReportsUserLegalRepresentorRedisLockTimeout
          ? ['APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsUserLegalRepresentorRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportUserLegalRepresentorFileName
          ? ['APP_SYNC_REPORTS_USERS_LEGAL_REPRESENTOR_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsUserLegalRepresentorCron = new CronJob(
      this.syncReportsUserLegalRepresentorCron,
      () => this.syncReportsUserLegalRepresentor(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_USER_LEGAL_REPRESENTOR.SYNC,
      syncReportsUserLegalRepresentorCron,
    );

    syncReportsUserLegalRepresentorCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncReportsUserLegalRepresentor() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsUserLegalRepresentorRedisKey,
      this.syncReportsUserLegalRepresentorRedisLockTimeout,
      this.syncReportsUserLegalRepresentorRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports user legal representor.');

          const reportUserLegalRepresentorRepository =
            new ReportUserLegalRepresentorDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsUserLegalRepresentorController =
            new SyncReportsUserLegalRepresentorController(
              logger,
              reportUserLegalRepresentorRepository,
              eguardianReportGateway,
              this.reportUserLegalRepresentorFileName,
            );

          await syncReportsUserLegalRepresentorController.execute();

          logger.debug('Sync reports user legal representor successfully.');
        } catch (error) {
          logger.error('Error with sync report user legal representor.', {
            error,
          });
        }
      },
    );
  }
}
