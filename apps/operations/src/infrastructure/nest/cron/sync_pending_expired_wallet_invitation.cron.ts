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
import { SyncPendingExpiredWalletInvitationController } from '@zro/operations/interface';
import {
  CRON_TASKS,
  WalletInvitationDatabaseRepository,
} from '@zro/operations/infrastructure';

export interface SyncPendingExpiredWalletInvitationCronConfig {
  APP_ENV: string;
  APP_SYNC_PENDING_WALLET_INVITATION_CRON: string;

  APP_SYNC_PENDING_WALLET_INVITATION_REDIS_KEY: string;
  APP_SYNC_PENDING_WALLET_INVITATION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PENDING_WALLET_INVITATION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncPendingExpiredWalletInvitationCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Envs for cron settings
   */
  private syncPendingWalletInvitationRedisKey: string;
  private syncPendingWalletInvitationRedisLockTimeout: number;
  private syncPendingWalletInvitationRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<SyncPendingExpiredWalletInvitationCronConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredWalletInvitationCronService.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncPendingWalletInvitationCron = this.configService.get<string>(
      'APP_SYNC_PENDING_WALLET_INVITATION_CRON',
    );

    //Cron redis settings
    this.syncPendingWalletInvitationRedisKey = this.configService.get<string>(
      'APP_SYNC_PENDING_WALLET_INVITATION_REDIS_KEY',
    );
    this.syncPendingWalletInvitationRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PENDING_WALLET_INVITATION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPendingWalletInvitationRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PENDING_WALLET_INVITATION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !syncPendingWalletInvitationCron ||
      !this.syncPendingWalletInvitationRedisKey ||
      !this.syncPendingWalletInvitationRedisLockTimeout ||
      !this.syncPendingWalletInvitationRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!syncPendingWalletInvitationCron
          ? ['APP_SYNC_PENDING_WALLET_INVITATION_CRON']
          : []),
        ...(!this.syncPendingWalletInvitationRedisKey
          ? ['APP_SYNC_PENDING_WALLET_INVITATION_REDIS_KEY']
          : []),
        ...(!this.syncPendingWalletInvitationRedisLockTimeout
          ? ['APP_SYNC_PENDING_WALLET_INVITATION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPendingWalletInvitationRedisRefreshInterval
          ? ['APP_SYNC_PENDING_WALLET_INVITATION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const cron = new CronJob(syncPendingWalletInvitationCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.WALLET_INVITATION.SYNC_PENDING_WALLET_INVITATION,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.WALLET_INVITATION.SYNC_PENDING_WALLET_INVITATION,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncPendingWalletInvitationRedisKey,
      this.syncPendingWalletInvitationRedisLockTimeout,
      this.syncPendingWalletInvitationRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const walletInvitationRepository =
            new WalletInvitationDatabaseRepository();

          const syncPendingWalletInvitationController =
            new SyncPendingExpiredWalletInvitationController(
              logger,
              walletInvitationRepository,
            );

          logger.debug('Sync pending wallet invitations to expired.');

          await syncPendingWalletInvitationController.execute();

          logger.debug('Sync wallet invitations done.');
        } catch (error) {
          logger.error('Error with sync wallet invitations.', { error });
        }
      },
    );
  }
}
