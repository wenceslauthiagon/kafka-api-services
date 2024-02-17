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
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import { SyncPixInfractionController } from '@zro/pix-payments/interface';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';

interface PixInfractionCronConfig {
  APP_ENV: string;
  APP_SYNC_PIX_INFRACTION_CRON: string;

  APP_SYNC_PIX_INFRACTION_REDIS_KEY: string;
  APP_SYNC_PIX_INFRACTION_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_PIX_INFRACTION_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class PixInfractionCronServiceInit implements OnModuleInit {
  private readonly syncPixInfractionRedisKey: string;
  private readonly syncPixInfractionRedisLockTimeout: number;
  private readonly syncPixInfractionRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      PixInfractionCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
  ) {
    this.logger = logger.child({ context: PixInfractionCronServiceInit.name });

    //Cron redis settings
    this.syncPixInfractionRedisKey = this.configService.get<string>(
      'APP_SYNC_PIX_INFRACTION_REDIS_KEY',
    );
    this.syncPixInfractionRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_INFRACTION_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncPixInfractionRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_PIX_INFRACTION_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.syncPixInfractionRedisKey ||
      !this.syncPixInfractionRedisLockTimeout ||
      !this.syncPixInfractionRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.syncPixInfractionRedisKey
          ? ['APP_SYNC_PIX_INFRACTION_REDIS_KEY']
          : []),
        ...(!this.syncPixInfractionRedisLockTimeout
          ? ['APP_SYNC_PIX_INFRACTION_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncPixInfractionRedisRefreshInterval
          ? ['APP_SYNC_PIX_INFRACTION_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const appSyncPixInfractionCron = this.configService.get<string>(
      'APP_SYNC_PIX_INFRACTION_CRON',
    );

    if (!appSyncPixInfractionCron) {
      throw new MissingEnvVarException([
        ...(!appSyncPixInfractionCron ? ['APP_SYNC_PIX_INFRACTION_CRON'] : []),
      ]);
    }

    const pixInfractionSync = new CronJob(appSyncPixInfractionCron, () =>
      this.syncPixInfraction(),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.PIX_INFRACTION.SYNC,
      pixInfractionSync,
    );

    pixInfractionSync.start();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncPixInfraction() {
    await this.redisService.semaphoreRefresh(
      this.syncPixInfractionRedisKey,
      this.syncPixInfractionRedisLockTimeout,
      this.syncPixInfractionRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.debug('Sync pix infraction started.');

        try {
          const pixInfractionRepository = new PixInfractionDatabaseRepository();

          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PixInfractionEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const jdpiPixPaymentGateway =
            this.jdpiService.getPixInfractionGateway(logger);

          const syncPixInfractionController = new SyncPixInfractionController(
            logger,
            pixInfractionRepository,
            serviceEmitter,
            jdpiPixPaymentGateway,
          );

          await syncPixInfractionController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync infractions.', error);
        }
      },
    );
  }
}
