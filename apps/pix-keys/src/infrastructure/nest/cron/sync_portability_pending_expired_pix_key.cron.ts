import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaService,
  MissingEnvVarException,
  RedisService,
  KafkaEventEmitter,
} from '@zro/common';
import {
  CRON_TASKS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { SyncPortabilityPendingExpiredPixKeyController } from '@zro/pix-keys/interface';

interface SyncPortabilityPendingExpiredPixKeyCronConfig {
  APP_ENV: string;
  APP_SYNC_PORTABILITY_PENDING_CRON: string;
  APP_SYNC_PORTABILITY_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_PORTABILITY_PENDING_REDIS_KEY: string;
  APP_SYNC_PORTABILITY_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PORTABILITY_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncPortabilityPendingExpiredPixKeyCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private readonly syncPortabilityPendingPixKeyTimestamp: number;

  /**
   * Envs for cron settings
   */
  private readonly syncPortabilityPendingRedisKey: string;
  private readonly syncPortabilityPendingRedisLockTimeout: number;
  private readonly syncPortabilityPendingRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncPortabilityPendingExpiredPixKeyCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncPortabilityPendingExpiredPixKeyCronService.name,
    });

    this.syncPortabilityPendingPixKeyTimestamp = parseInt(
      this.configService.get<string>(
        'APP_SYNC_PORTABILITY_PENDING_TIMESTAMP_CRON',
      ),
    );

    //Cron redis settings
    this.syncPortabilityPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_PORTABILITY_PENDING_REDIS_KEY',
    );

    this.syncPortabilityPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PORTABILITY_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );

    this.syncPortabilityPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PORTABILITY_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncPortabilityPendingPixKeyTimestamp ||
      !this.syncPortabilityPendingRedisKey ||
      !this.syncPortabilityPendingRedisLockTimeout ||
      !this.syncPortabilityPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncPortabilityPendingPixKeyTimestamp
          ? ['APP_SYNC_PORTABILITY_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncPortabilityPendingRedisKey
          ? ['APP_SYNC_PORTABILITY_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncPortabilityPendingRedisLockTimeout
          ? ['APP_SYNC_PORTABILITY_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPortabilityPendingRedisRefreshInterval
          ? ['APP_SYNC_PORTABILITY_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncPortabilityPendingCron = this.configService.get<string>(
      'APP_SYNC_PORTABILITY_PENDING_CRON',
    );

    if (!syncPortabilityPendingCron) {
      throw new MissingEnvVarException('APP_SYNC_PORTABILITY_PENDING_CRON');
    }

    const cron = new CronJob(syncPortabilityPendingCron, () => this.execute());

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.KEY.SYNC_PORTABILITY_PENDING,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.KEY.SYNC_PORTABILITY_PENDING,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncPortabilityPendingRedisKey,
      this.syncPortabilityPendingRedisLockTimeout,
      this.syncPortabilityPendingRedisRefreshInterval,
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

          const syncPortabilityPendingExpiredPixKeyController =
            new SyncPortabilityPendingExpiredPixKeyController(
              logger,
              pixKeyRepository,
              serviceEmitter,
              this.syncPortabilityPendingPixKeyTimestamp,
            );

          logger.debug(
            'Sync portability pending pixKey to portability closing.',
          );

          await syncPortabilityPendingExpiredPixKeyController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync portability pending.', error);
        }
      },
    );
  }
}
