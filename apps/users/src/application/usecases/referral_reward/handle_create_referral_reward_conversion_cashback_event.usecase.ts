import { Logger } from 'winston';
import {
  MissingDataException,
  formatValueFromIntBpsToFloat,
  formatValueFromFloatToInt,
  getMoment,
} from '@zro/common';
import {
  UserRepository,
  ReferralReward,
  ReferralRewardRepository,
  PersonType,
  OnboardingRepository,
} from '@zro/users/domain';
import { Currency, Operation } from '@zro/operations/domain';

export class HandleCreateReferralRewardConversionCashbackEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userRepository User repository.
   * @param referralRewardRepository Referral reward repository.
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly onboardingRepository: OnboardingRepository,
    private readonly referralRewardRepository: ReferralRewardRepository,
    private readonly transactionTagValid: string,
    private readonly affiliateMonthMinimum: number,
    private readonly cashbackAmountBps: number,
  ) {
    this.logger = logger.child({
      context: HandleCreateReferralRewardConversionCashbackEventUseCase.name,
    });
  }

  /**
   * Handler triggered when operation event is accepted.
   * This creates the referral reward of the affiliates' conversion operation.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    ownerOperation: Operation,
    beneficiaryOperation: Operation,
    conversionCurrency: Currency,
  ): Promise<ReferralReward> {
    // Data input check
    if (!ownerOperation && !beneficiaryOperation) {
      throw new MissingDataException(['At least one operation']);
    }

    if (ownerOperation) {
      // Check if the transaction tag is valid
      if (ownerOperation.transactionType.tag !== this.transactionTagValid) {
        this.logger.debug('Invalid transaction tag.', {
          transactionTag: ownerOperation.transactionType.tag,
        });
        return;
      }
    }

    if (beneficiaryOperation) {
      // Check if the transaction tag is valid
      if (
        beneficiaryOperation.transactionType.tag !== this.transactionTagValid
      ) {
        this.logger.debug('Invalid transaction tag.', {
          transactionTag: beneficiaryOperation.transactionType.tag,
        });
        return;
      }
    }

    // Check if the currency has a valid id and get the operation that has the allowed currency
    let operation = null;
    if (ownerOperation?.currency?.id === conversionCurrency.id) {
      operation = ownerOperation;
    } else if (beneficiaryOperation?.currency?.id === conversionCurrency.id) {
      operation = beneficiaryOperation;
    } else {
      this.logger.debug('Invalid operation currency.', {
        validCurrency: conversionCurrency,
        ownerOperationCurrency: ownerOperation?.currency,
        beneficiaryOperationCurrency: beneficiaryOperation?.currency,
      });
      return;
    }

    operation.currency = conversionCurrency;

    // Get the owner or beneficiary because it depends on the operation side
    const affiliate = operation.owner || operation.beneficiary;

    // Data affiliate check
    if (!affiliate?.id) {
      this.logger.error('Invalid affiliate user.', { affiliate });
      return;
    }

    const affiliateUser = await this.userRepository.getById(affiliate.id);

    this.logger.debug('AffiliateUser found.', { user: affiliateUser });

    if (!affiliateUser) {
      this.logger.debug('AffiliateUser not found.', { user: affiliateUser });
      return;
    }

    if (affiliateUser.type !== PersonType.NATURAL_PERSON) {
      this.logger.debug('Invalid affiliateUser type.', {
        type: affiliateUser.type,
      });
      return;
    }

    if (!affiliateUser.referredBy?.id) {
      this.logger.debug('AffiliateUser referredBy required.', {
        user: affiliateUser.referredBy,
      });
      return;
    }

    if (affiliateUser.id === affiliateUser.referredBy.id) {
      this.logger.debug('AffiliateUser has the same referredBy ID.', {
        user: affiliateUser.id,
        referredBy: affiliateUser.referredBy.id,
      });
      return;
    }

    const referralUser = await this.userRepository.getById(
      affiliateUser.referredBy.id,
    );

    this.logger.debug('ReferralUser found.', { user: referralUser });

    if (!referralUser) {
      this.logger.debug('ReferralUser not found.', {
        user: affiliateUser.referredBy,
      });
      return;
    }

    if (referralUser.type !== PersonType.NATURAL_PERSON) {
      this.logger.debug('Invalid referralUser type.', {
        type: referralUser.type,
      });
      return;
    }

    // Get onboarding
    const affiliateUserOnboarding =
      await this.onboardingRepository.getByUserAndStatusIsFinished(
        affiliateUser,
      );

    this.logger.debug('AffiliateUser onboarding found.', {
      onboarding: affiliateUserOnboarding,
    });

    if (!affiliateUserOnboarding) {
      this.logger.debug('AffiliateUser onboarding not found.', {
        affiliateUser,
      });
      return;
    }

    // Get timestamp minus the time of month from affiliate.
    const startDate = getMoment().subtract(this.affiliateMonthMinimum, 'month');

    // Check if user has a new account
    if (startDate.isAfter(affiliateUserOnboarding.updatedAt)) {
      this.logger.debug('AffiliateUser has an old onboarding.', {
        updatedAt: affiliateUserOnboarding.updatedAt,
      });
      return;
    }

    // Get mininum value between convsersion side amount
    const cashbackAmount =
      formatValueFromIntBpsToFloat(this.cashbackAmountBps) *
      Math.min(operation.value, operation.rawValue);

    const referralReward: ReferralReward = {
      awardedBy: affiliateUser,
      awardedTo: referralUser,
      amount: formatValueFromFloatToInt(
        cashbackAmount,
        operation.currency.decimal,
      ),
      operation,
    };
    const referralRewardCreated =
      await this.referralRewardRepository.create(referralReward);

    this.logger.debug('Referral reward created.', { referralRewardCreated });

    return referralRewardCreated;
  }
}
