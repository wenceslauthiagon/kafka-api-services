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
import {
  CRON_TASKS,
  PixRefundEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';
import { SyncPixRefundController } from '@zro/pix-payments/interface';

interface PixRefundCronConfig {
  APP_ENV: string;
  APP_SYNC_PIX_REFUND_CRON: string;

  APP_SYNC_PIX_REFUND_REDIS_KEY: string;
  APP_SYNC_PIX_REFUND_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PIX_REFUND_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixRefundCronServiceInit implements OnModuleInit {
  private readonly syncPixRefundRedisKey: string;
  private readonly syncPixRefundRedisLockTimeout: number;
  private readonly syncPixRefundRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PixRefundCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
  ) {
    this.logger = logger.child({ context: PixRefundCronServiceInit.name });

    //Cron redis settings
    this.syncPixRefundRedisKey = this.configService.get<string>(
      'APP_SYNC_PIX_REFUND_REDIS_KEY',
    );
    this.syncPixRefundRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_PIX_REFUND_REDIS_LOCK_TIMEOUT'),
    );
    this.syncPixRefundRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_REFUND_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncPixRefundRedisKey ||
      !this.syncPixRefundRedisLockTimeout ||
      !this.syncPixRefundRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncPixRefundRedisKey
          ? ['APP_SYNC_PIX_REFUND_REDIS_KEY']
          : []),
        ...(!this.syncPixRefundRedisLockTimeout
          ? ['APP_SYNC_PIX_REFUND_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPixRefundRedisRefreshInterval
          ? ['APP_SYNC_PIX_REFUND_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appSyncPixRefundCron = this.configService.get<string>(
      'APP_SYNC_PIX_REFUND_CRON',
    );

    if (!appSyncPixRefundCron) {
      throw new MissingEnvVarException(['APP_SYNC_PIX_REFUND_CRON']);
    }

    const pixRefundSync = new CronJob(appSyncPixRefundCron, () =>
      this.syncPixRefund(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_REFUND.SYNC,
      pixRefundSync,
    );

    pixRefundSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncPixRefund() {
    await this.redisService.semaphoreRefresh(
      this.syncPixRefundRedisKey,
      this.syncPixRefundRedisLockTimeout,
      this.syncPixRefundRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Sync pix refund started.');

        try {
          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PixRefundEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const jdpiPixPaymentGateway =
            this.jdpiService.getPixRefundGateway(logger);

          const syncPixRefundController = new SyncPixRefundController(
            logger,
            serviceEmitter,
            jdpiPixPaymentGateway,
          );

          await syncPixRefundController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync pix refund.', error);
        }
      },
    );
  }
}
