import { Span } from 'nestjs-otel';
import { CronJob } from 'cron';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  InjectLogger,
  KafkaService,
  MissingEnvVarException,
  InvalidDataFormatException,
  RedisService,
} from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { SyncReferralRewardConversionCashbackController } from '@zro/users/interface';
import {
  CRON_TASKS,
  OnboardingDatabaseRepository,
  OperationServiceKafka,
  OtcServiceKafka,
  ReferralRewardDatabaseRepository,
} from '@zro/users/infrastructure';

export interface SyncReferralRewardConversionCashbackCronConfig {
  APP_ENV: string;
  APP_REFERRAL_REWARD_MIN_LENGTH: string;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CRON: string;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_TRANSACTION_TAG: string;
  APP_SYNC_REFERRAL_REWARD_INTERVAL_START_DAYS: string;
  APP_SYNC_REFERRAL_REWARD_INTERVAL_END_DAYS: string;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CURRENCY_SYMBOL: string;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL: string;

  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_KEY: string;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_LOCK_TIMEOUT: number;
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_REFRESH_INTERVAL: number;
}

@Injectable()
export class SyncReferralRewardConversionCashbackCronService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly affiliateSizeMinimum: number;
  private readonly referralRewardIntervalStartDays: number;
  private readonly referralRewardIntervalEndDays: number;
  private readonly referralRewardConversionCashbackTransactionTag: string;
  private readonly referralRewardConversionCashbackCurrencySymbol: string;
  private readonly referralRewardConversionCurrencySymbol: string;
  /**
   * Envs for cron settings
   */
  private readonly referralRewardConversionCashbackRedisKey: string;
  private readonly referralRewardConversionCashbackRedisLockTimeout: number;
  private readonly referralRewardConversionCashbackRedisRefreshInterval: number;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<SyncReferralRewardConversionCashbackCronConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({
      context: SyncReferralRewardConversionCashbackCronService.name,
    });

    this.affiliateSizeMinimum = Number(
      this.configService.get<string>('APP_REFERRAL_REWARD_MIN_LENGTH'),
    );
    this.referralRewardConversionCurrencySymbol =
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL',
      );
    this.referralRewardConversionCashbackCurrencySymbol =
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CURRENCY_SYMBOL',
      );
    this.referralRewardIntervalStartDays = Number(
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_INTERVAL_START_DAYS',
      ),
    );
    this.referralRewardIntervalEndDays = Number(
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_INTERVAL_END_DAYS',
      ),
    );
    this.referralRewardConversionCashbackTransactionTag =
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_TRANSACTION_TAG',
      );

    // Cron redis settings
    this.referralRewardConversionCashbackRedisKey =
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_KEY',
      );
    this.referralRewardConversionCashbackRedisLockTimeout = Number(
      this.configService.get<number>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_LOCK_TIMEOUT',
      ),
    );
    this.referralRewardConversionCashbackRedisRefreshInterval = Number(
      this.configService.get<number>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_REFRESH_INTERVAL',
      ),
    );

    if (
      !this.affiliateSizeMinimum ||
      !this.referralRewardConversionCurrencySymbol ||
      !this.referralRewardConversionCashbackCurrencySymbol ||
      !this.referralRewardConversionCashbackTransactionTag ||
      !this.referralRewardIntervalStartDays ||
      !this.referralRewardIntervalEndDays ||
      !this.referralRewardConversionCashbackRedisKey ||
      !this.referralRewardConversionCashbackRedisLockTimeout ||
      !this.referralRewardConversionCashbackRedisRefreshInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.affiliateSizeMinimum
          ? ['APP_REFERRAL_REWARD_MIN_LENGTH']
          : []),
        ...(!this.referralRewardConversionCurrencySymbol
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL']
          : []),
        ...(!this.referralRewardConversionCashbackCurrencySymbol
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CURRENCY_SYMBOL']
          : []),
        ...(!this.referralRewardConversionCashbackTransactionTag
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_TRANSACTION_TAG']
          : []),
        ...(!this.referralRewardIntervalStartDays
          ? ['APP_SYNC_REFERRAL_REWARD_INTERVAL_START_DAYS']
          : []),
        ...(!this.referralRewardIntervalEndDays
          ? ['APP_SYNC_REFERRAL_REWARD_INTERVAL_END_DAYS']
          : []),
        ...(!this.referralRewardConversionCashbackRedisKey
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_KEY']
          : []),
        ...(!this.referralRewardConversionCashbackRedisLockTimeout
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_LOCK_TIMEOUT']
          : []),
        ...(!this.referralRewardConversionCashbackRedisRefreshInterval
          ? [
              'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_REDIS_REFRESH_INTERVAL',
            ]
          : []),
      ]);
    }

    // Sanitize check
    if (
      this.referralRewardIntervalEndDays >= this.referralRewardIntervalStartDays
    ) {
      this.logger.error(
        '"APP_SYNC_REFERRAL_REWARD_INTERVAL_END_DAYS" must be less than "APP_SYNC_REFERRAL_REWARD_INTERVAL_START_DAYS" ',
      );
      throw new InvalidDataFormatException([
        'APP_SYNC_REFERRAL_REWARD_INTERVAL_END_DAYS',
        'APP_SYNC_REFERRAL_REWARD_INTERVAL_START_DAYS',
      ]);
    }
  }

  async onModuleInit() {
    if (this.configService.get<string>('APP_ENV') === 'test') return;

    const syncReferralRewardConversionCashbackCron =
      this.configService.get<string>(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CRON',
      );

    if (!syncReferralRewardConversionCashbackCron) {
      throw new MissingEnvVarException(
        'APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_CRON',
      );
    }

    // Search base currency
    const baseCurrency = new CurrencyEntity({
      symbol: this.referralRewardConversionCashbackCurrencySymbol,
    });

    this.logger.debug('Base currency found.', { baseCurrency });

    // Search amount currency
    const amountCurrency = new CurrencyEntity({
      symbol: this.referralRewardConversionCurrencySymbol,
    });

    this.logger.debug('Amount currency found.', { amountCurrency });

    const cron = new CronJob(syncReferralRewardConversionCashbackCron, () =>
      this.execute(baseCurrency, amountCurrency),
    );

    this.schedulerRegistry.addCronJob(
      CRON_TASKS.REFERRAL_REWARD.SYNC_CONVERSION_CASHBACK,
      cron,
    );

    cron.start();
  }

  /**
   * Shutdown quotation service.
   */
  onModuleDestroy() {
    // Delete interval
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.schedulerRegistry.deleteCronJob(
        CRON_TASKS.REFERRAL_REWARD.SYNC_CONVERSION_CASHBACK,
      );
    }
  }

  @Span() // Creates Span to be collected by OpenTelemetry.
  async execute(baseCurrency: Currency, amountCurrency: Currency) {
    await this.redisService.semaphoreRefresh(
      this.referralRewardConversionCashbackRedisKey,
      this.referralRewardConversionCashbackRedisLockTimeout,
      this.referralRewardConversionCashbackRedisRefreshInterval,
      async () => {
        const requestId = uuidV4();
        const logger = this.logger.child({ loggerId: requestId });

        logger.info('Sync referralReward conversion cashback.');

        const referralRewardRepository = new ReferralRewardDatabaseRepository();
        const onboardingRepository = new OnboardingDatabaseRepository();

        if (!this.kafkaService) {
          logger.error('Missing kafkaService');
          return;
        }

        const otcService = new OtcServiceKafka(
          requestId,
          logger,
          this.kafkaService,
        );

        const operationService = new OperationServiceKafka(
          requestId,
          logger,
          this.kafkaService,
        );

        const controller = new SyncReferralRewardConversionCashbackController(
          logger,
          referralRewardRepository,
          onboardingRepository,
          otcService,
          operationService,
          this.referralRewardConversionCashbackTransactionTag,
          this.referralRewardIntervalStartDays,
          this.referralRewardIntervalEndDays,
          this.affiliateSizeMinimum,
        );

        await controller.execute({ baseCurrency, amountCurrency });

        logger.info('Sync referralReward conversion cashback successfully.');
      },
    );
  }
}
