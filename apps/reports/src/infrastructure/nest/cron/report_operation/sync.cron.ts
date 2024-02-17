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
import { SyncReportsOperationsController } from '@zro/reports/interface';
import {
  CRON_TASKS,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';

export interface SyncReportsOperationsCronConfig {
  APP_ENV: string;
  APP_SYNC_REPORTS_OPERATIONS_CRON: string;

  APP_SYNC_REPORTS_OPERATIONS_REDIS_KEY: string;
  APP_SYNC_REPORTS_OPERATIONS_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REPORTS_OPERATIONS_REDIS_REFRESH_INTERVAL: number;

  APP_SYNC_REPORTS_OPERATIONS_FILE_NAME: string;
}

@Injectable()
export class SyncReportsOperationsCronServiceInit implements OnModuleInit {
  private reportOperationFileName: string;
  private syncReportsOperationsCron: string;

  /**
   * Envs for cron settings
   */
  private syncReportsOperationsRedisKey: string;
  private syncReportsOperationsRedisLockTimeout: number;
  private syncReportsOperationsRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<
      SyncReportsOperationsCronConfig & EguardianConfig
    >,
    private readonly redisService: RedisService,
    private readonly eguardianService: EguardianReportService,
  ) {
    this.logger = logger.child({
      context: SyncReportsOperationsCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    this.syncReportsOperationsCron = this.configService.get<string>(
      'APP_SYNC_REPORTS_OPERATIONS_CRON',
    );
    this.syncReportsOperationsRedisKey = this.configService.get<string>(
      'APP_SYNC_REPORTS_OPERATIONS_REDIS_KEY',
    );
    this.syncReportsOperationsRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_OPERATIONS_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncReportsOperationsRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REPORTS_OPERATIONS_REDIS_REFRESH_INTERVAL',
      ),
    );
    this.reportOperationFileName = this.configService.get<string>(
      'APP_SYNC_REPORTS_OPERATIONS_FILE_NAME',
    );

    if (
      !this.syncReportsOperationsCron ||
      !this.syncReportsOperationsRedisKey ||
      !this.syncReportsOperationsRedisLockTimeout ||
      !this.syncReportsOperationsRedisRefreshInterval ||
      !this.reportOperationFileName
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncReportsOperationsCron
          ? ['APP_SYNC_REPORTS_OPERATIONS_CRON']
          : []),
        ...(!this.syncReportsOperationsRedisKey
          ? ['APP_SYNC_REPORTS_OPERATIONS_REDIS_KEY']
          : []),
        ...(!this.syncReportsOperationsRedisLockTimeout
          ? ['APP_SYNC_REPORTS_OPERATIONS_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncReportsOperationsRedisRefreshInterval
          ? ['APP_SYNC_REPORTS_OPERATIONS_REDIS_REFRESH_INTERVAL']
          : []),
        ...(!this.reportOperationFileName
          ? ['APP_SYNC_REPORTS_OPERATIONS_FILE_NAME']
          : []),
      ]);
    }

    const syncReportsOperationsCron = new CronJob(
      this.syncReportsOperationsCron,
      () => this.syncReportsOperations(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REPORT_OPERATION.SYNC,
      syncReportsOperationsCron,
    );

    syncReportsOperationsCron.start();
  }

  async syncReportsOperations() {
    await this.redisService.semaphoreRefresh(
      this.syncReportsOperationsRedisKey,
      this.syncReportsOperationsRedisLockTimeout,
      this.syncReportsOperationsRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          logger.debug('Sync reports operations.');

          const reportOperationRepository =
            new ReportOperationDatabaseRepository();

          const eguardianReportGateway =
            this.eguardianService.getReportGateway(logger);

          const syncReportsOperationsController =
            new SyncReportsOperationsController(
              logger,
              reportOperationRepository,
              eguardianReportGateway,
              this.reportOperationFileName,
            );

          await syncReportsOperationsController.execute();

          logger.debug('Sync reports operations successfully.');
        } catch (error) {
          logger.error('Error with sync report operations.', { error });
        }
      },
    );
  }
}
