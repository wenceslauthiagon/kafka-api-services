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
import { SyncPendingExpiredPixKeyController } from '@zro/pix-keys/interface';

interface SyncPendingPixKeyCronConfig {
  APP_ENV: string;
  APP_SYNC_PENDING_CRON: string;
  APP_SYNC_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_PENDING_PIX_KEY_REDIS_KEY: string;
  APP_SYNC_PENDING_PIX_KEY_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PENDING_PIX_KEY_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncPendingPixKeyCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private readonly syncPendingPixKeyTimestamp: number;

  /**
   * Envs for cron settings
   */
  private readonly syncPendingPixKeyRedisKey: string;
  private readonly syncPendingPixKeyRedisLockTimeout: number;
  private readonly syncPendingPixKeyRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncPendingPixKeyCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: SyncPendingPixKeyCronService.name });

    this.syncPendingPixKeyTimestamp = parseInt(
      this.configService.get<string>('APP_SYNC_PENDING_TIMESTAMP_CRON'),
    );

    //Cron redis settings
    this.syncPendingPixKeyRedisKey = this.configService.get<string>(
      'APP_SYNC_PENDING_PIX_KEY_REDIS_KEY',
    );
    this.syncPendingPixKeyRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PENDING_PIX_KEY_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPendingPixKeyRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PENDING_PIX_KEY_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncPendingPixKeyTimestamp ||
      !this.syncPendingPixKeyRedisKey ||
      !this.syncPendingPixKeyRedisLockTimeout ||
      !this.syncPendingPixKeyRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncPendingPixKeyTimestamp
          ? ['APP_SYNC_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncPendingPixKeyRedisKey
          ? ['APP_SYNC_PENDING_PIX_KEY_REDIS_KEY']
          : []),
        ...(!this.syncPendingPixKeyRedisLockTimeout
          ? ['APP_SYNC_PENDING_PIX_KEY_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPendingPixKeyRedisRefreshInterval
          ? ['APP_SYNC_PENDING_PIX_KEY_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncPendingCron = this.configService.get<string>(
      'APP_SYNC_PENDING_CRON',
    );

    if (!syncPendingCron) {
      throw new MissingEnvVarException('APP_SYNC_PENDING_CRON');
    }

    const cron = new CronJob(syncPendingCron, () => this.execute());

    this.schedulerRegistry.addCronJob(CRON_TASKS.KEY.SYNC_PENDING, cron);

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(CRON_TASKS.KEY.SYNC_PENDING);
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncPendingPixKeyRedisKey,
      this.syncPendingPixKeyRedisLockTimeout,
      this.syncPendingPixKeyRedisRefreshInterval,
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

          logger.debug('Sync pending pixKey to canceled.');

          const syncPendingPixKeyController =
            new SyncPendingExpiredPixKeyController(
              logger,
              pixKeyRepository,
              serviceEmitter,
              this.syncPendingPixKeyTimestamp,
            );

          await syncPendingPixKeyController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync claim pending.', error);
        }
      },
    );
  }
}
