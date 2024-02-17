import { Span } from 'nestjs-otel';
import axios from 'axios';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import * as csv from 'csvtojson';
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
  getMoment,
} from '@zro/common';
import {
  CRON_TASKS,
  BankTedEventKafkaEmitter,
  BankTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import {
  SyncBankTedController,
  SyncBankTedRequest,
} from '@zro/banking/interface';

export interface BankTedCronConfig {
  APP_ENV: string;
  APP_ZROBANK_CODE: string;
  APP_SYNC_BANK_TED_CRON: string;
  APP_BACEN_TED_FILE_URL: string;

  APP_SYNC_BANK_TED_REDIS_KEY: string;
  APP_SYNC_BANK_TED_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_BANK_TED_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class BankTedCronServiceInit implements OnModuleInit {
  /**
   * Get zroBank code
   */
  private ZROBANK_CODE: string;

  /**
   * Get cron bacen url
   */
  private BACEN_TED_URL: string;

  /**
   * Envs for cron settings
   */
  private syncBankTedRedisKey: string;
  private syncBankTedRedisLockTimeout: number;
  private syncBankTedRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<BankTedCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: BankTedCronServiceInit.name });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    this.ZROBANK_CODE = this.configService.get<string>('APP_ZROBANK_CODE');

    this.BACEN_TED_URL = this.configService.get<string>(
      'APP_BACEN_TED_FILE_URL',
    );
    const appSyncBankTedCron = this.configService.get<string>(
      'APP_SYNC_BANK_TED_CRON',
    );

    //Cron redis settings
    this.syncBankTedRedisKey = this.configService.get<string>(
      'APP_SYNC_BANK_TED_REDIS_KEY',
    );
    this.syncBankTedRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_BANK_TED_REDIS_LOCK_TIMEOUT'),
    );
    this.syncBankTedRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_BANK_TED_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.ZROBANK_CODE ||
      !this.BACEN_TED_URL ||
      !appSyncBankTedCron ||
      !this.syncBankTedRedisKey ||
      !this.syncBankTedRedisLockTimeout ||
      !this.syncBankTedRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.ZROBANK_CODE ? ['APP_ZROBANK_CODE'] : []),
        ...(!this.BACEN_TED_URL ? ['APP_BACEN_TED_FILE_URL'] : []),
        ...(!appSyncBankTedCron ? ['APP_SYNC_BANK_TED_CRON'] : []),
        ...(!this.syncBankTedRedisKey ? ['APP_SYNC_BANK_TED_REDIS_KEY'] : []),
        ...(!this.syncBankTedRedisLockTimeout
          ? ['APP_SYNC_BANK_TED_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncBankTedRedisRefreshInterval
          ? ['APP_SYNC_BANK_TED_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const bankTedSync = new CronJob(appSyncBankTedCron, () =>
      this.syncBankTed(),
    );

    this.schedulerRegistry.addCronJob(CRON_TASKS.BANK_TED.SYNC, bankTedSync);

    bankTedSync.start();

    // Start sync bank ASAP!
    this.syncBankTed();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncBankTed() {
    await this.redisService.semaphoreRefresh(
      this.syncBankTedRedisKey,
      this.syncBankTedRedisLockTimeout,
      this.syncBankTedRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new BankTedEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        try {
          const bankRepository = new BankTedDatabaseRepository();

          const syncBankTedController = new SyncBankTedController(
            logger,
            bankRepository,
            serviceEmitter,
            this.ZROBANK_CODE,
          );

          logger.debug('Sync bankTeds to update.');

          const request = await this.download(logger);

          logger.debug('Sync bankTed request.', { request: request?.length });
          if (!request?.length) return;

          await syncBankTedController.execute(request);

          await emitter.fireEvents();

          logger.info('Sync bankTeds successfully.');
        } catch (error) {
          logger.error('Error with sync bankTed.', {
            error: error.isAxiosError ? error.message : error,
          });
        }
      },
    );
  }

  /**
   * Download a CSV file from BACEN and parse it to get bankTed data.
   */
  @Span() // Creates Span to be collected by OpenTelemetry.
  private async download(logger: Logger): Promise<SyncBankTedRequest[]> {
    logger.debug(`Downloading from ${this.BACEN_TED_URL}.`);

    // Download CSV file as stream.
    return axios
      .get(this.BACEN_TED_URL, { responseType: 'stream' })
      .then((response) => {
        // Create CSV parser.
        const parser = csv({ trim: true, delimiter: ',' });

        // Parse CSV in a promise.
        return new Promise((resolve, reject) => {
          // Banks found.
          const banks: SyncBankTedRequest[] = [];

          // When stream is finished.
          parser.on('done', () => {
            logger.debug(`Downloaded ${banks.length} bankTed.`);
            resolve(banks);
          });

          // When parse is failed.
          parser.on('error', (error) => {
            reject(error);
          });

          // For each bank found
          parser.on('data', (data) => {
            const bank = JSON.parse(data.toString('utf8'));

            if (bank['Número_Código'] !== 'n/a') {
              banks.push({
                id: uuidV4(),
                ispb: bank.ISPB,
                name: bank.Nome_Reduzido,
                code: bank['Número_Código'],
                fullName: bank.Nome_Extenso,
                active: true,
                startedAt: getMoment(
                  bank['Início_da_Operação'],
                  'DD/MM/YYYY',
                ).toDate(),
              });
            }
          });

          // Parse CSV
          response.data.pipe(parser);
        });
      });
  }
}
