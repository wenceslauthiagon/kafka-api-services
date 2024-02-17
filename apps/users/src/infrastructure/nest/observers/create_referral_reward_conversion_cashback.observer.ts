import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  OnboardingRepository,
  ReferralRewardRepository,
  UserRepository,
} from '@zro/users/domain';
import { OperationService } from '@zro/users/application';
import {
  HandleCreateReferralRewardConversionCashbackEventController,
  HandleCreateReferralRewardConversionCashbackEventRequest,
} from '@zro/users/interface';
import {
  OnboardingDatabaseRepository,
  UserDatabaseRepository,
  ReferralRewardDatabaseRepository,
  OperationServiceKafka,
} from '@zro/users/infrastructure';
import { KAFKA_EVENTS } from '@zro/operations/infrastructure/kafka';

export type HandleCreateReferralRewardConversionCashbackEventKafkaRequest =
  KafkaMessage<HandleCreateReferralRewardConversionCashbackEventRequest>;

export interface CreateReferralRewardConversionCashbackConfig {
  APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL: string;
  APP_REFERRAL_REWARD_VALID_CONVERSION_TRANSACTION_TAG: string;
  APP_REFERRAL_REWARD_MIN_ACCOUNT_CREATED_AT_IN_MONTH: string;
  APP_REFERRAL_REWARD_CASHBACK_AMOUNT_BPS: string;
}

/**
 * Create referral reward conversion cashback events observer.
 */
@Controller()
@ObserverController()
export class CreateReferralRewardConversionCashbackNestObserver {
  private readonly conversionCurrencySymbol: string;
  private readonly transactionTagValid: string;
  private readonly affiliateMonthMinimum: number;
  private readonly cashbackAmountBps: number;

  constructor(
    private readonly configService: ConfigService<CreateReferralRewardConversionCashbackConfig>,
  ) {
    this.conversionCurrencySymbol = this.configService.get<string>(
      'APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL',
    );
    this.transactionTagValid = this.configService.get<string>(
      'APP_REFERRAL_REWARD_VALID_CONVERSION_TRANSACTION_TAG',
    );
    this.affiliateMonthMinimum = Number(
      this.configService.get<string>(
        'APP_REFERRAL_REWARD_MIN_ACCOUNT_CREATED_AT_IN_MONTH',
      ),
    );
    this.cashbackAmountBps = Number(
      this.configService.get<string>('APP_REFERRAL_REWARD_CASHBACK_AMOUNT_BPS'),
    );

    if (
      !this.conversionCurrencySymbol ||
      !this.transactionTagValid ||
      !this.affiliateMonthMinimum ||
      !this.cashbackAmountBps
    ) {
      throw new MissingEnvVarException([
        ...(!this.conversionCurrencySymbol
          ? ['APP_SYNC_REFERRAL_REWARD_CONVERSION_CASHBACK_TRANSACTION_TAG']
          : []),
        ...(!this.transactionTagValid
          ? ['APP_REFERRAL_REWARD_VALID_CONVERSION_TRANSACTION_TAG']
          : []),
        ...(!this.affiliateMonthMinimum
          ? ['APP_REFERRAL_REWARD_MIN_ACCOUNT_CREATED_AT_IN_MONTH']
          : []),
        ...(!this.cashbackAmountBps
          ? ['APP_REFERRAL_REWARD_CASHBACK_AMOUNT_BPS']
          : []),
      ]);
    }
  }

  /**
   * Handler triggered when operation event is accepted.
   *
   * @param message Event Kafka message.
   * @param userRepository User repository.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.OPERATION.ACCEPTED)
  async execute(
    @Payload('value')
    message: HandleCreateReferralRewardConversionCashbackEventRequest,
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(OnboardingDatabaseRepository)
    onboardingRepository: OnboardingRepository,
    @RepositoryParam(ReferralRewardDatabaseRepository)
    referralRewardRepository: ReferralRewardRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(CreateReferralRewardConversionCashbackNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandleCreateReferralRewardConversionCashbackEventRequest(message);

    logger.info('Handle create referral reward conversion cashback event.', {
      payload,
    });

    const controller =
      new HandleCreateReferralRewardConversionCashbackEventController(
        logger,
        userRepository,
        onboardingRepository,
        referralRewardRepository,
        operationService,
        this.conversionCurrencySymbol,
        this.transactionTagValid,
        this.affiliateMonthMinimum,
        this.cashbackAmountBps,
      );

    try {
      // Call handle pending user event controller.
      await controller.execute(payload);

      logger.info('Get affiliate conversion cashback event handled.');
    } catch (error) {
      logger.error(
        'Failed to handle create referral reward conversion cashback event.',
        { stack: error.stack },
      );
      // FIXME: Should notify IT team.
    }
  }
}
