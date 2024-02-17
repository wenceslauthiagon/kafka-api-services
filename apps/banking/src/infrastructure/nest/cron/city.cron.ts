import { Span } from 'nestjs-otel';
import axios from 'axios';
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
import { SyncCityController, SyncCityRequest } from '@zro/banking/interface';
import {
  CRON_TASKS,
  CityDatabaseRepository,
  CityEventKafkaEmitter,
} from '@zro/banking/infrastructure';

interface DownloadCityResponse {
  'municipio-id': string;
  'municipio-nome': string;
  'UF-id': string;
  'UF-nome': string;
  'UF-sigla': string;
  'regiao-id': string;
  'regiao-nome': string;
  'regiao-sigla': string;
}

export interface CityCronConfig {
  APP_ENV: string;
  APP_SYNC_CITY_CRON: string;
  APP_CITY_LIST_URL: string;

  APP_SYNC_CITY_REDIS_KEY: string;
  APP_SYNC_CITY_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_CITY_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class CityCronServiceInit implements OnModuleInit {
  /**
   * Get cron city list url
   */
  private CITY_LIST_URL: string;

  /**
   * Envs for cron settings
   */
  private syncCityRedisKey: string;
  private syncCityRedisLockTimeout: number;
  private syncCityRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService<CityCronConfig>,
    private kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: CityCronServiceInit.name });
  }

  onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    this.CITY_LIST_URL = this.configService.get<string>('APP_CITY_LIST_URL');
    const appSyncCityCron =
      this.configService.get<string>('APP_SYNC_CITY_CRON');

    //Cron redis settings
    this.syncCityRedisKey = this.configService.get<string>(
      'APP_SYNC_CITY_REDIS_KEY',
    );
    this.syncCityRedisLockTimeout = Number(
      this.configService.get<number>('APP_SYNC_CITY_REDIS_LOCK_TIMEOUT'),
    );
    this.syncCityRedisRefreshInterval = Number(
      this.configService.get<number>('APP_SYNC_CITY_REDIS_REFRESH_INTERVAL'),
    );

    if (
      !this.CITY_LIST_URL ||
      !appSyncCityCron ||
      !this.syncCityRedisKey ||
      !this.syncCityRedisLockTimeout ||
      !this.syncCityRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.CITY_LIST_URL ? ['APP_CITY_LIST_URL'] : []),
        ...(!appSyncCityCron ? ['APP_SYNC_CITY_CRON'] : []),
        ...(!this.syncCityRedisKey ? ['APP_SYNC_CITY_REDIS_KEY'] : []),
        ...(!this.syncCityRedisLockTimeout
          ? ['APP_SYNC_CITY_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.syncCityRedisRefreshInterval
          ? ['APP_SYNC_CITY_REDIS_REFRESH_INTERVAL']
          : []),
      ]);
    }

    const citySync = new CronJob(appSyncCityCron, () => this.syncCity());

    this.schedulerRegistry.addCronJob(CRON_TASKS.CITY.SYNC, citySync);

    citySync.start();

    // Start sync bank ASAP!
    this.syncCity();
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async syncCity() {
    await this.redisService.semaphoreRefresh(
      this.syncCityRedisKey,
      this.syncCityRedisLockTimeout,
      this.syncCityRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });
        const emitter = new KafkaEventEmitter(logger, this.kafkaService);
        const serviceEmitter = new CityEventKafkaEmitter(
          requestId,
          emitter,
          logger,
        );

        try {
          const cityRepository = new CityDatabaseRepository();

          const syncCityController = new SyncCityController(
            logger,
            cityRepository,
            serviceEmitter,
          );

          logger.debug('Sync cities to update.');

          const request = await this.download(logger);

          logger.debug('Sync city request.', { request: request?.length });
          if (!request?.length) return;

          await syncCityController.execute(request);

          await emitter.fireEvents();

          logger.info('Sync cities successfully.');
        } catch (error) {
          logger.error('Error with sync cities.', {
            error: error.isAxiosError ? error.message : error,
          });
        }
      },
    );
  }

  /**
   * Download the cities file online and parse it to get cities data.
   */
  @Span() // Creates Span to be collected by OpenTelemetry.
  async download(logger: Logger): Promise<SyncCityRequest[]> {
    logger.debug(`Downloading from ${this.CITY_LIST_URL}.`);

    // Download the file as JSON.
    const response = await axios.get<DownloadCityResponse[]>(
      this.CITY_LIST_URL,
    );

    // Cities found.
    return response.data.map(
      (city) =>
        new SyncCityRequest({
          id: uuidV4(),
          code: city['municipio-id']?.toString(),
          name: city['municipio-nome'],
          federativeUnitCode: city['UF-id']?.toString(),
          federativeUnitName: city['UF-nome'],
          federativeUnitAcronym: city['UF-sigla'],
          regionCode: city['regiao-id']?.toString(),
          regionName: city['regiao-nome'],
          regionAcronym: city['regiao-sigla'],
          active: true,
        }),
    );
  }
}
