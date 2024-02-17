import { Span } from 'nestjs-otel';
import { v4 as uuidV4 } from 'uuid';
import { CronJob } from 'cron';
import { Logger } from 'winston';
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
  PixKeyClaimDatabaseRepository,
  PixKeyClaimEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { SyncGetAllPixKeyClaimController } from '@zro/pix-keys/interface';
import { JdpiGatewayConfig, JdpiPixService } from '@zro/jdpi';

interface SyncGetAllPixKeyClaimConfig {
  APP_ENV: string;
  APP_SYNC_GET_ALL_PIX_KEY_CLAIM_CRON: string;
  APP_SYNC_GET_ALL_PIX_KEY_CLAIM_PAGE_SIZE: string;
  APP_SYNC_GET_ALL_PIX_KEY_CLAIM_LIMIT_DAY: string;
  APP_SYNC_GET_ALL_PIX_KEY_REDIS_KEY: string;
  APP_SYNC_GET_ALL_PIX_KEY_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_GET_ALL_PIX_KEY_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncGetAllPixKeyClaimCronService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly ispb: string;
  private readonly pageSize: number;
  private readonly limitDay: number;

  private readonly syncGetAllPixKeyRedisKey: string;
  private readonly syncGetAllPixKeyRedisLockTimeout: number;
  private readonly syncGetAllPixKeyRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      SyncGetAllPixKeyClaimConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiPixService,
  ) {
    this.logger = logger.child({
      context: SyncGetAllPixKeyClaimCronService.name,
    });

    this.ispb = this.configService.get<string>('APP_ZROBANK_ISPB');
    this.pageSize = Number(
      this.configService.get<string>(
        'APP_SYNC_GET_ALL_PIX_KEY_CLAIM_PAGE_SIZE',
      ) ?? 100,
    );
    this.limitDay = Number(
      this.configService.get<string>(
        'APP_SYNC_GET_ALL_PIX_KEY_CLAIM_LIMIT_DAY',
      ) ?? 15,
    );

    // Cron redis settings
    this.syncGetAllPixKeyRedisKey = this.configService.get<string>(
      'APP_SYNC_GET_ALL_PIX_KEY_REDIS_KEY',
    );
    this.syncGetAllPixKeyRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_GET_ALL_PIX_KEY_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.syncGetAllPixKeyRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_GET_ALL_PIX_KEY_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.ispb ||
      !this.pageSize ||
      !this.limitDay ||
      !this.syncGetAllPixKeyRedisKey ||
      !this.syncGetAllPixKeyRedisLockTimeout ||
      !this.syncGetAllPixKeyRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.ispb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.pageSize ? ['APP_SYNC_GET_ALL_PIX_KEY_CLAIM_PAGE_SIZE'] : []),
        ...(!this.limitDay ? ['APP_SYNC_GET_ALL_PIX_KEY_CLAIM_LIMIT_DAY'] : []),
        ...(!this.syncGetAllPixKeyRedisKey
          ? ['APP_SYNC_GET_ALL_PIX_KEY_REDIS_KEY']
          : []),
        ...(!this.syncGetAllPixKeyRedisLockTimeout
          ? ['APP_SYNC_GET_ALL_PIX_KEY_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncGetAllPixKeyRedisRefreshInterval
          ? ['APP_SYNC_GET_ALL_PIX_KEY_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') {
      return;
    }

    const checkUpdateCron = this.configService.get<string>(
      'APP_SYNC_GET_ALL_PIX_KEY_CLAIM_CRON',
    );

    if (!checkUpdateCron) {
      throw new MissingEnvVarException('APP_SYNC_GET_ALL_PIX_KEY_CLAIM_CRON');
    }

    const cron = new CronJob(checkUpdateCron, () => this.execute());

    this.schedulerRegistry.addCronJob(CRON_TASKS.CLAIM.SYNC_GET_ALL, cron);

    cron.start();
  }

  onModuleDestroy() {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(CRON_TASKS.CLAIM.SYNC_GET_ALL);
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute() {
    await this.redisService.semaphoreRefresh(
      this.syncGetAllPixKeyRedisKey,
      this.syncGetAllPixKeyRedisLockTimeout,
      this.syncGetAllPixKeyRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const pspGateway = this.jdpiService.getPixKeyGateway(logger);

        try {
          const emitter = new KafkaEventEmitter(logger, this.kafkaService);
          const serviceEmitter = new PixKeyClaimEventKafkaEmitter(
            requestId,
            emitter,
            logger,
          );

          const pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();

          const syncGetAllPixKeyClaimController =
            new SyncGetAllPixKeyClaimController(
              logger,
              pixKeyClaimRepository,
              serviceEmitter,
              pspGateway,
              this.ispb,
              this.pageSize,
              this.limitDay,
            );

          logger.debug('Sync get all pix key claim.', {
            limitDayRequest: this.limitDay,
            pageSizeRequest: this.pageSize,
          });

          await syncGetAllPixKeyClaimController.execute();

          logger.debug('Firing kafka events.');
          await emitter.fireEvents();
        } catch (error) {
          logger.error('Error with sync get all pix key claim.', error);
        }
      },
    );
  }
}
