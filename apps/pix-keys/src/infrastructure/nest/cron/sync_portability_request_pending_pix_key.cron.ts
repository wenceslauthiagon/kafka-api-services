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
  SyncPortabilityRequestPendingPixKeyController,
  SyncClaimPendingExpiredPixKeyRequest,
} from '@zro/pix-keys/interface';

interface SyncPortabilityRequestPendingPixKeyCronConfig {
  APP_ENV: string;
  APP_SYNC_PORTABILITY_REQUEST_PENDING_CRON: string;
  APP_SYNC_PORTABILITY_REQUEST_PENDING_TIMESTAMP_CRON: number;

  APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_KEY: string;
  APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncPortabilityRequestPendingPixKeyCronService
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Get cron timestamp env
   */
  private readonly syncPortabilityRequestPendingPixKeyTimestamp: number;

  /**
   * Envs for cron settings
   */
  private readonly syncPortabilityRequestPendingRedisKey: string;
  private readonly syncPortabilityRequestPendingRedisLockTimeout: number;
  private readonly syncPortabilityRequestPendingRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<SyncPortabilityRequestPendingPixKeyCronConfig>,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncPortabilityRequestPendingPixKeyCronService.name,
    });

    this.syncPortabilityRequestPendingPixKeyTimestamp = parseInt(
      this.configService.get<string>(
        'APP_SYNC_PORTABILITY_REQUEST_PENDING_TIMESTAMP_CRON',
      ),
    );

    //Cron redis settings
    this.syncPortabilityRequestPendingRedisKey = this.configService.get<string>(
      'APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_KEY',
    );
    this.syncPortabilityRequestPendingRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPortabilityRequestPendingRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncPortabilityRequestPendingPixKeyTimestamp ||
      !this.syncPortabilityRequestPendingRedisKey ||
      !this.syncPortabilityRequestPendingRedisLockTimeout ||
      !this.syncPortabilityRequestPendingRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncPortabilityRequestPendingPixKeyTimestamp
          ? ['APP_SYNC_PORTABILITY_REQUEST_PENDING_TIMESTAMP_CRON']
          : []),
        ...(!this.syncPortabilityRequestPendingRedisKey
          ? ['APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_KEY']
          : []),
        ...(!this.syncPortabilityRequestPendingRedisLockTimeout
          ? ['APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPortabilityRequestPendingRedisRefreshInterval
          ? ['APP_SYNC_PORTABILITY_REQUEST_PENDING_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const syncPortabilityRequestPendingCron = this.configService.get<string>(
      'APP_SYNC_PORTABILITY_REQUEST_PENDING_CRON',
    );

    if (!syncPortabilityRequestPendingCron) {
      throw new MissingEnvVarException(
        'APP_SYNC_PORTABILITY_REQUEST_PENDING_CRON',
      );
    }

    const cron = new CronJob(syncPortabilityRequestPendingCron, () =>
      this.execute(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.KEY.SYNC_PORTABILITY_REQUEST_PENDING,
      cron,
    );

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.KEY.SYNC_PORTABILITY_REQUEST_PENDING,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncPortabilityRequestPendingRedisKey,
      this.syncPortabilityRequestPendingRedisLockTimeout,
      this.syncPortabilityRequestPendingRedisRefreshInterval,
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

          const syncPortabilityRequestPendingPixKeyController =
            new SyncPortabilityRequestPendingPixKeyController(
              logger,
              pixKeyRepository,
              pixKeyClaimRepository,
              serviceEmitter,
              this.syncPortabilityRequestPendingPixKeyTimestamp,
            );

          const request: SyncClaimPendingExpiredPixKeyRequest = {
            reason: ClaimReasonType.DEFAULT_OPERATION,
          };

          logger.debug(
            'Sync portability request pending to request confirm opened pixKey.',
            {
              request,
            },
          );

          await syncPortabilityRequestPendingPixKeyController.execute(request);

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync portability request pending.', error);
        }
      },
    );
  }
}
