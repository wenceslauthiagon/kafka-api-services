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
import {
  CRON_TASKS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { SyncOwnershipPendingExpiredPixKeyController } from '@zro/pix-keys/interface';

interface SyncOwnershipPendingExpiredPixKeyCronConfig {
  APP_ENV: string;
  APP_SYNC_OWNERSHIP_PENDING_CRON: string;
  APP_SYNC_OWNERSHIP_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_OWNERSHIP_PENDING_REDIS_KEY: string;
  APP_SYNC_OWNERSHIP_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_OWNERSHIP_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncOwnershipPendingExpiredPixKeyCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private readonly syncOwnershipPendingPixKeyTimestamp: number;

  /**
   * Envs for cron settings
   */
  private readonly syncOwnershipPendingRedisKey: string;
  private readonly syncOwnershipPendingRedisLockTimeout: number;
  private readonly syncOwnershipPendingRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncOwnershipPendingExpiredPixKeyCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncOwnershipPendingExpiredPixKeyCronService.name,
    });

    this.syncOwnershipPendingPixKeyTimestamp = parseInt(
      this.configService.get<string>(
        'APP_SYNC_OWNERSHIP_PENDING_TIMESTAMP_CRON',
      ),
    );

    //Cron redis settings
    this.syncOwnershipPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_OWNERSHIP_PENDING_REDIS_KEY',
    );
    this.syncOwnershipPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_OWNERSHIP_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncOwnershipPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_OWNERSHIP_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncOwnershipPendingPixKeyTimestamp ||
      !this.syncOwnershipPendingRedisKey ||
      !this.syncOwnershipPendingRedisLockTimeout ||
      !this.syncOwnershipPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncOwnershipPendingPixKeyTimestamp
          ? ['APP_SYNC_OWNERSHIP_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncOwnershipPendingRedisKey
          ? ['APP_SYNC_OWNERSHIP_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncOwnershipPendingRedisLockTimeout
          ? ['APP_SYNC_OWNERSHIP_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncOwnershipPendingRedisRefreshInterval
          ? ['APP_SYNC_OWNERSHIP_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncOwnershipPendingCron = this.configService.get<string>(
      'APP_SYNC_OWNERSHIP_PENDING_CRON',
    );

    if (!syncOwnershipPendingCron) {
      throw new MissingEnvVarException('APP_SYNC_OWNERSHIP_PENDING_CRON');
    }

    const cron = new CronJob(syncOwnershipPendingCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.KEY.SYNC_OWNERSHIP_PENDING,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.KEY.SYNC_OWNERSHIP_PENDING,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncOwnershipPendingRedisKey,
      this.syncOwnershipPendingRedisLockTimeout,
      this.syncOwnershipPendingRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        try {
          const pixKeyRepository = new PixKeyDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PixKeyEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const syncOwnershipPendingPixKeyController =
            new SyncOwnershipPendingExpiredPixKeyController(
              logger,
              pixKeyRepository,
              serviceEmitter,
              this.syncOwnershipPendingPixKeyTimestamp,
            );

          logger.debug('Sync ownership pending pixKey to ownership closing.');

          await syncOwnershipPendingPixKeyController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync ownership pending.', error);
        }
      },
    );
  }
}
