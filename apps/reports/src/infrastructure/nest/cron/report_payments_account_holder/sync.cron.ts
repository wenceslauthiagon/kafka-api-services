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
import { SyncReportsPaymentsAccountHolderController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportUserDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsPaymentsAccountHolderCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_CRON: string;

  APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_KEY: string;
  APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_FILE_NAME: string;
}

@Injectable()
export class SyncReportsPaymentsAccountHolderCronServiceInit
  implements OnModuleInit
{
  private reportPaymentsAccountHolderFileName: string;
  private syncReportsPaymentsAccountHolderCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsPaymentsAccountHolderRedisKey: string;
  private syncReportsPaymentsAccountHolderRedisLockTimeout: number;
  private syncReportsPaymentsAccountHolderRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsPaymentsAccountHolderCronConfig & EguardianConfig
    >,
    private readonly eguardianService: EguardianReportService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncReportsPaymentsAccountHolderCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsPaymentsAccountHolderCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_CRON',
    );
    this.syncReportsPaymentsAccountHolderRedisKey =
      this.configService.get<string>(
        'APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_KEY',
      );
    this.syncReportsPaymentsAccountHolderRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsPaymentsAccountHolderRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportPaymentsAccountHolderFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_FILE_NAME',
    );

    if (
      !this.syncReportsPaymentsAccountHolderCron ||
      !this.syncReportsPaymentsAccountHolderRedisKey ||
      !this.syncReportsPaymentsAccountHolderRedisLockTimeout ||
      !this.syncReportsPaymentsAccountHolderRedisRefreshInterval ||
      !this.reportPaymentsAccountHolderFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsPaymentsAccountHolderCron
          ? ['APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_CRON']
          : []),
        ...(!this.syncReportsPaymentsAccountHolderRedisKey
          ? ['APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_KEY']
          : []),
        ...(!this.syncReportsPaymentsAccountHolderRedisLockTimeout
          ? ['APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsPaymentsAccountHolderRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportPaymentsAccountHolderFileName
          ? ['APP_SYNC_REPORTS_PAYMENTS_ACCOUNT_HOLDER_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsPaymentsAccountHolderCron = new CronJob(
      this.syncReportsPaymentsAccountHolderCron,
      () => this.syncReportsPaymentsAccountHolder(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_PAYMENTS_ACCOUNT_HOLDER.SYNC,
      syncReportsPaymentsAccountHolderCron,
    );

    syncReportsPaymentsAccountHolderCron.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncReportsPaymentsAccountHolder() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsPaymentsAccountHolderRedisKey,
      this.syncReportsPaymentsAccountHolderRedisLockTimeout,
      this.syncReportsPaymentsAccountHolderRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports payments account holder.');

          const reportUserRepository = new ReportUserDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsPaymentsAccountHolderController =
            new SyncReportsPaymentsAccountHolderController(
              logger,
              reportUserRepository,
              eguardianReportGateway,
              this.reportPaymentsAccountHolderFileName,
            );

          await syncReportsPaymentsAccountHolderController.execute();

          logger.debug('Sync reports payments account holder successfully.');
        } catch (error) {
          logger.error('Error with sync report payments account holder.', {
            error,
          });
        }
      },
    );
  }
}
