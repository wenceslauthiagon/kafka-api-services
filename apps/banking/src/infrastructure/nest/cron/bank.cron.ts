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
  BankDatabaseRepository,
  BankEventKafkaEmitter,
} from '@zro/banking/infrastructure';
import { SyncBankController, SyncBankRequest } from '@zro/banking/interface';
import { JdpiGatewayConfig, JdpiBankService } from '@zro/jdpi';

interface BankCronConfig {
  APP_ENV: string;
  APP_ZROBANK_ISPB: string;
  APP_SYNC_BANK_CRON: string;

  APP_SYNC_BANK_REDIS_KEY: string;
  APP_SYNC_BANK_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BANK_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class BankCronServiceInit implements OnModuleInit {
  /**
   * Get zroBank ispb
   */
  private ZROBANK_ISPB: string;

  /**
   * Envs for cron settings
   */
  private syncBankRedisKey: string;
  private syncBankRedisLockTimeout: number;
  private syncBankRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService<
      BankCronConfig & JdpiGatewayConfig
    >,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly jdpiService: JdpiBankService,
  ) {
    this.logger = logger.child({ context: BankCronServiceInit.name });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    this.ZROBANK_ISPB = this.configService.get<string>('APP_ZROBANK_ISPB');

    const appSyncBankCron =
      this.configService.get<string>('APP_SYNC_BANK_CRON');

    //Cron redis settings
    this.syncBankRedisKey = this.configService.get<string>(
      'APP_SYNC_BANK_REDIS_KEY',
    );
    this.syncBankRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_BANK_REDIS_LOCK_TIMEOUT'),
    );
    this.syncBankRedisRefreshInterval = Number(
      this.configService.get<number>('APP_SYNC_BANK_REDIS_REFRESH_INTERVAL'),
    );

    if (
      !this.ZROBANK_ISPB ||
      !appSyncBankCron ||
      !this.syncBankRedisKey ||
      !this.syncBankRedisLockTimeout ||
      !this.syncBankRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.ZROBANK_ISPB ? ['APP_ZROBANK_ISPB'] : []),
        ...(!appSyncBankCron ? ['APP_SYNC_BANK_CRON'] : []),
        ...(!this.syncBankRedisKey ? ['APP_SYNC_BANK_REDIS_KEY'] : []),
        ...(!this.syncBankRedisLockTimeout
          ? ['APP_SYNC_BANK_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBankRedisRefreshInterval
          ? ['APP_SYNC_BANK_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const bankSync = new CronJob(appSyncBankCron, () => this.syncBank());

    this.schedulerRegistry.addCronJob(CRON_TASKS.BANK.SYNC, bankSync);

    bankSync.start();

    // Start sync bank ASAP!
    this.syncBank();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncBank() {
    await this.redisService.semaphoreRefresh(
      this.syncBankRedisKey,
      this.syncBankRedisLockTimeout,
      this.syncBankRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new BankEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        try {
          const bankRepository = new BankDatabaseRepository();

          const syncBankController = new SyncBankController(
            logger,
            bankRepository,
            serviceEmitter,
            this.ZROBANK_ISPB,
          );

          const request = await this.getAllBanks(logger);

          logger.debug('Sync bank request.', { request: request?.length });
          if (!request?.length) return;

          await syncBankController.execute(request);

          await emitter.fireEvents();

          logger.info('Sync banks successfully.');
        } catch (error) {
          logger.error('Error with sync banks.', error);
        }
      },
    );
  }

  private async getAllBanks(logger: Logger): Promise<SyncBankRequest[]> {
    const pspGateway = this.jdpiService.getBankGateway(logger);

    const banks = await pspGateway.getAllBank();
    logger.debug('Get all banks.', { banks });

    return banks.map(
      (bank) =>
        new SyncBankRequest({
          id: uuidV4(),
          ispb: bank.ispb,
          name: bank.name,
          fullName: bank.fullName,
          active: true,
          startedAt: bank.startedAt,
        }),
    );
  }
}
