import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { ClaimReasonType } from '@zro/pix-keys/domain';
import {
  CRON_TASKS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import {
  SyncClaimPendingExpiredPixKeyController,
  SyncClaimPendingExpiredPixKeyRequest,
} from '@zro/pix-keys/interface';

interface SyncClaimPendingExpiredPixKeyCronConfig {
  APP_ENV: string;
  APP_SYNC_CLAIM_PENDING_CRON: string;
  APP_SYNC_CLAIM_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_CLAIM_PENDING_REDIS_KEY: string;
  APP_SYNC_CLAIM_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CLAIM_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncClaimPendingExpiredPixKeyCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private readonly syncClaimPendingPixKeyTimestamp: number;

  /**
   * Envs for cron settings
   */
  private readonly syncClaimPendingRedisKey: string;
  private readonly syncClaimPendingRedisLockTimeout: number;
  private readonly syncClaimPendingRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncClaimPendingExpiredPixKeyCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncClaimPendingExpiredPixKeyCronService.name,
    });

    this.syncClaimPendingPixKeyTimestamp = parseInt(
      this.configService.get<string>('APP_SYNC_CLAIM_PENDING_TIMESTAMP_CRON'),
    );

    //Cron redis settings
    this.syncClaimPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_CLAIM_PENDING_REDIS_KEY',
    );
    this.syncClaimPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_CLAIM_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncClaimPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_CLAIM_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncClaimPendingPixKeyTimestamp ||
      !this.syncClaimPendingRedisKey ||
      !this.syncClaimPendingRedisLockTimeout ||
      !this.syncClaimPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncClaimPendingPixKeyTimestamp
          ? ['APP_SYNC_CLAIM_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncClaimPendingRedisKey
          ? ['APP_SYNC_CLAIM_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncClaimPendingRedisLockTimeout
          ? ['APP_SYNC_CLAIM_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncClaimPendingRedisRefreshInterval
          ? ['APP_SYNC_CLAIM_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncClaimPendingCron = this.configService.get<string>(
      'APP_SYNC_CLAIM_PENDING_CRON',
    );

    if (!syncClaimPendingCron) {
      throw new MissingEnvVarException('APP_SYNC_CLAIM_PENDING_CRON');
    }

    const cron = new CronJob(syncClaimPendingCron, () => this.execute());

    this.schedulerRegistry.addCronJob(CRON_TASKS.KEY.SYNC_CLAIM_PENDING, cron);

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(CRON_TASKS.KEY.SYNC_CLAIM_PENDING);
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncClaimPendingRedisKey,
      this.syncClaimPendingRedisLockTimeout,
      this.syncClaimPendingRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const pixKeyRepository = new PixKeyDatabaseRepository();

          const pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PixKeyEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const syncClaimPendingPixKeyController =
            new SyncClaimPendingExpiredPixKeyController(
              logger,
              pixKeyRepository,
              pixKeyClaimRepository,
              serviceEmitter,
              this.syncClaimPendingPixKeyTimestamp,
            );

          const request: SyncClaimPendingExpiredPixKeyRequest = {
            reason: ClaimReasonType.DEFAULT_OPERATION,
          };

          logger.debug('Sync claim pending pixKey to claim closing.', {
            request,
          });

          await syncClaimPendingPixKeyController.execute(request);

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync claim pending.', error);
        }
      },
    );
  }
}
