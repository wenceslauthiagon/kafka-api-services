import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  UserLimit,
  UserLimitRepository,
  UserLimitEntity,
} from '@zro/operations/domain';
import {
  DailyLimitAboveMonthlyException,
  DailyLimitUnderMaxAmountException,
  MaxAmountLimitAboveDailyException,
  MaxAmountLimitUnderMinAmountException,
  MaxAmountNightlyLimitAboveNightlyException,
  MaxAmountNightlyLimitUnderMinAmountNightlyException,
  MinAmountLimitAboveMaxAmountException,
  MinAmountLimitUnderZeroException,
  MinAmountNightlyLimitAboveMaxAmountException,
  MinAmountNightlyLimitUnderZeroException,
  MonthlyLimitAboveYearlyException,
  MonthlyLimitUnderDailyException,
  NightlyLimitAboveDailyException,
  NightlyLimitUnderMaxAmountNightlyException,
  UserLimitEventEmitter,
  UserLimitNotFoundException,
  YearlyLimitUnderMonthlyException,
} from '@zro/operations/application';

export class UpdateUserLimitByAdminUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitRepository User Limit repository.
   * @param userLimitEventEmitter User Limit event emitter.
   */
  constructor(
    private logger: Logger,
    private userLimitRepository: UserLimitRepository,
    private userLimitEventEmitter: UserLimitEventEmitter,
  ) {
    logger.child({ context: UpdateUserLimitByAdminUseCase.name });
  }

  async execute(
    userLimit: UserLimitEntity,
    newUserLimit: UserLimitEntity,
  ): Promise<UserLimit> {
    if (!userLimit?.id) {
      throw new MissingDataException(['User Limit ID']);
    }

    // User limit exists?
    const userLimitFound = await this.userLimitRepository.getById(userLimit.id);

    if (!userLimitFound) {
      throw new UserLimitNotFoundException(userLimit);
    }

    const userLimitWithNewLimits = new UserLimitEntity({
      ...userLimitFound,
      ...newUserLimit,
    });

    if (newUserLimit.yearlyLimit) {
      this.verifyYearlyLimit(newUserLimit, userLimitWithNewLimits);

      // Check if user defined yearly limit is above new yearly limit.
      if (
        userLimitWithNewLimits.userYearlyLimit >
        userLimitWithNewLimits.yearlyLimit
      ) {
        userLimitWithNewLimits.userYearlyLimit =
          userLimitWithNewLimits.yearlyLimit;
      }
    }

    if (newUserLimit.monthlyLimit) {
      this.verifyMonthlyLimit(newUserLimit, userLimitWithNewLimits);

      // Check if user defined monthly limit is above new monthly limit.
      if (
        userLimitWithNewLimits.userMonthlyLimit >
        userLimitWithNewLimits.monthlyLimit
      ) {
        userLimitWithNewLimits.userMonthlyLimit =
          userLimitWithNewLimits.monthlyLimit;
      }
    }

    if (newUserLimit.dailyLimit) {
      this.verifyDailyLimit(newUserLimit, userLimitWithNewLimits);

      // Check if user defined daily limit is above new daily limit.
      if (
        userLimitWithNewLimits.userDailyLimit >
        userLimitWithNewLimits.dailyLimit
      ) {
        userLimitWithNewLimits.userDailyLimit =
          userLimitWithNewLimits.dailyLimit;
      }
    }

    if (newUserLimit.nightlyLimit) {
      this.verifyNightlyLimit(newUserLimit, userLimitWithNewLimits);

      // Check if user defined nightly limit is above new nightly limit.
      if (
        userLimitWithNewLimits.userNightlyLimit >
        userLimitWithNewLimits.nightlyLimit
      ) {
        userLimitWithNewLimits.userNightlyLimit =
          userLimitWithNewLimits.nightlyLimit;
      }
    }

    if (newUserLimit.maxAmount) {
      this.verifyMaxAmount(newUserLimit, userLimitWithNewLimits);

      // Check if user defined max amount limit is above new max amount limit.
      if (
        userLimitWithNewLimits.userMaxAmount > userLimitWithNewLimits.maxAmount
      ) {
        userLimitWithNewLimits.userMaxAmount = userLimitWithNewLimits.maxAmount;
      }
    }

    if (newUserLimit.minAmount) {
      this.verifyMinAmount(newUserLimit, userLimitWithNewLimits);

      // Check if user defined min amount limit is under new min amount limit.
      if (
        userLimitWithNewLimits.userMinAmount < userLimitWithNewLimits.minAmount
      ) {
        userLimitWithNewLimits.userMinAmount = userLimitWithNewLimits.minAmount;
      }
    }

    if (newUserLimit.maxAmountNightly) {
      this.verifyMaxAmountNightly(newUserLimit, userLimitWithNewLimits);

      // Check if user defined max amount nightly limit is above new max amount nightly limit.
      if (
        userLimitWithNewLimits.userMaxAmountNightly >
        userLimitWithNewLimits.maxAmountNightly
      ) {
        userLimitWithNewLimits.userMaxAmountNightly =
          userLimitWithNewLimits.maxAmountNightly;
      }
    }

    if (newUserLimit.minAmountNightly) {
      this.verifyMinAmountNightly(newUserLimit, userLimitWithNewLimits);

      // Check if user defined min amount nightly limit is under new min amount nightly limit.
      if (
        userLimitWithNewLimits.userMinAmountNightly <
        userLimitWithNewLimits.minAmountNightly
      ) {
        userLimitWithNewLimits.userMinAmountNightly =
          userLimitWithNewLimits.minAmountNightly;
      }
    }

    const userLimitUpdated = await this.userLimitRepository.update(
      userLimitWithNewLimits,
    );

    this.userLimitEventEmitter.updatedUserLimit(userLimitUpdated);

    return userLimitUpdated;
  }

  private verifyYearlyLimit(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new yearly limit is under monthly limit.
    if (newUserLimit.yearlyLimit < userLimit.monthlyLimit) {
      throw new YearlyLimitUnderMonthlyException(
        newUserLimit.yearlyLimit,
        userLimit.monthlyLimit,
      );
    }
  }

  private verifyMonthlyLimit(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new monthly limit is above yearly limit.
    if (newUserLimit.monthlyLimit > userLimit.yearlyLimit) {
      throw new MonthlyLimitAboveYearlyException(
        newUserLimit.monthlyLimit,
        userLimit.yearlyLimit,
      );
    }

    // Check if new monthly limit is under daily limit.
    if (newUserLimit.monthlyLimit < userLimit.dailyLimit) {
      throw new MonthlyLimitUnderDailyException(
        newUserLimit.monthlyLimit,
        userLimit.dailyLimit,
      );
    }
  }

  private verifyDailyLimit(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new daily limit is above monthly limit.
    if (newUserLimit.dailyLimit > userLimit.monthlyLimit) {
      throw new DailyLimitAboveMonthlyException(
        newUserLimit.dailyLimit,
        userLimit.monthlyLimit,
      );
    }

    // Check if new daily limit is under max amount.
    if (newUserLimit.dailyLimit < userLimit.maxAmount) {
      throw new DailyLimitUnderMaxAmountException(
        newUserLimit.dailyLimit,
        userLimit.maxAmount,
      );
    }
  }

  private verifyNightlyLimit(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new nightly limit is above daily limit.
    if (newUserLimit.nightlyLimit > userLimit.dailyLimit) {
      throw new NightlyLimitAboveDailyException(
        newUserLimit.nightlyLimit,
        userLimit.dailyLimit,
      );
    }

    // Check if new nightly limit is under max amount nightly.
    if (newUserLimit.nightlyLimit < userLimit.maxAmountNightly) {
      throw new NightlyLimitUnderMaxAmountNightlyException(
        newUserLimit.nightlyLimit,
        userLimit.maxAmountNightly,
      );
    }
  }

  private verifyMaxAmount(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new max amount limit is above daily limit.
    if (newUserLimit.maxAmount > userLimit.dailyLimit) {
      throw new MaxAmountLimitAboveDailyException(
        newUserLimit.maxAmount,
        userLimit.dailyLimit,
      );
    }

    // Check if new max amount limit is under min amount.
    if (newUserLimit.maxAmount < userLimit.minAmount) {
      throw new MaxAmountLimitUnderMinAmountException(
        newUserLimit.maxAmount,
        userLimit.minAmount,
      );
    }
  }

  private verifyMinAmount(newUserLimit: UserLimit, userLimit: UserLimit) {
    // Check if new min amount limit is above max amount limit.
    if (newUserLimit.minAmount > userLimit.maxAmount) {
      throw new MinAmountLimitAboveMaxAmountException(
        newUserLimit.minAmount,
        userLimit.maxAmount,
      );
    }

    // Check if new min amount limit is under 0.
    if (newUserLimit.minAmount < 0) {
      throw new MinAmountLimitUnderZeroException(newUserLimit.maxAmount);
    }
  }

  private verifyMaxAmountNightly(
    newUserLimit: UserLimit,
    userLimit: UserLimit,
  ) {
    // Check if new max amount nightly limit is above nightly limit.
    if (newUserLimit.maxAmountNightly > userLimit.nightlyLimit) {
      throw new MaxAmountNightlyLimitAboveNightlyException(
        newUserLimit.maxAmountNightly,
        userLimit.nightlyLimit,
      );
    }

    // Check if new max amount nightly limit is under min amount nightly.
    if (newUserLimit.maxAmountNightly < userLimit.minAmountNightly) {
      throw new MaxAmountNightlyLimitUnderMinAmountNightlyException(
        newUserLimit.maxAmountNightly,
        userLimit.minAmountNightly,
      );
    }
  }

  private verifyMinAmountNightly(
    newUserLimit: UserLimit,
    userLimit: UserLimit,
  ) {
    // Check if new min amount nightly limit is above max amount nightly limit.
    if (newUserLimit.minAmountNightly > userLimit.maxAmountNightly) {
      throw new MinAmountNightlyLimitAboveMaxAmountException(
        newUserLimit.minAmountNightly,
        userLimit.maxAmountNightly,
      );
    }

    // Check if new min amount nightly limit is under 0.
    if (newUserLimit.minAmountNightly < 0) {
      throw new MinAmountNightlyLimitUnderZeroException(newUserLimit.maxAmount);
    }
  }
}
