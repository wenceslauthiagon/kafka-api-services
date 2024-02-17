import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  InjectLogger,
  KafkaEventEmitter,
  KafkaService,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';
import {
  CRON_TASKS,
  PixFraudDetectionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import { SyncPixFraudDetectionController } from '@zro/pix-payments/interface';

interface FraudDetectionCronConfig {
  APP_ENV: string;
  APP_SYNC_PIX_FRAUD_DETECTION_CRON: string;

  APP_SYNC_PIX_FRAUD_DETECTION_REDIS_KEY: string;
  APP_SYNC_PIX_FRAUD_DETECTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PIX_FRAUD_DETECTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixFraudDetectionCronServiceInit implements OnModuleInit {
  /**
   * Envs for cron settings
   */
  private syncPixFraudDetectionRedisKey: string;
  private syncPixFraudDetectionRedisLockTimeout: number;
  private syncPixFraudDetectionRedisRefreshInterval: number;

  /**
   * Get cron timestamp env
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      FraudDetectionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
  ) {
    this.logger = logger.child({
      context: PixFraudDetectionCronServiceInit.name,
    });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const pixFraudDetectionSync = new CronJob(
      this.configService.get<string>('APP_SYNC_PIX_FRAUD_DETECTION_CRON'),
      () => this.syncPixFraudDetection(),
    );

    //Cron redis settings
    this.syncPixFraudDetectionRedisKey = this.configService.get<string>(
      'APP_SYNC_PIX_FRAUD_DETECTION_REDIS_KEY',
    );
    this.syncPixFraudDetectionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_FRAUD_DETECTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPixFraudDetectionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_FRAUD_DETECTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !pixFraudDetectionSync ||
      !this.syncPixFraudDetectionRedisKey ||
      !this.syncPixFraudDetectionRedisLockTimeout ||
      !this.syncPixFraudDetectionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!pixFraudDetectionSync
          ? ['APP_SYNC_PIX_FRAUD_DETECTION_CRON']
          : []),
        ...(!this.syncPixFraudDetectionRedisKey
          ? ['APP_SYNC_PIX_FRAUD_DETECTION_REDIS_KEY']
          : []),
        ...(!this.syncPixFraudDetectionRedisLockTimeout
          ? ['APP_SYNC_PIX_FRAUD_DETECTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPixFraudDetectionRedisRefreshInterval
          ? ['APP_SYNC_PIX_FRAUD_DETECTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_FRAUD_DETECTION.SYNC,
      pixFraudDetectionSync,
    );

    pixFraudDetectionSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncPixFraudDetection() {
    await this.redisService.semaphoreRefresh(
      this.syncPixFraudDetectionRedisKey,
      this.syncPixFraudDetectionRedisLockTimeout,
      this.syncPixFraudDetectionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixFraudDetectionGateway(logger);

        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new PixFraudDetectionEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        logger.debug('Sync pix fraud detection started.');

        const syncPixFraudDetectionController =
          new SyncPixFraudDetectionController(
            logger,
            serviceEmitter,
            pspGateway,
          );

        try {
          await syncPixFraudDetectionController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync pix fraud detections.', error);
        }
      },
    );
  }
}
