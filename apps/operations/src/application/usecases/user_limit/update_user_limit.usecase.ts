import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { User } from '@zro/users/domain';
import {
  UserLimit,
  UserLimitRepository,
  GlobalLimitRepository,
  UserLimitEntity,
  LimitTypeRepository,
  LimitType,
} from '@zro/operations/domain';
import {
  DataException,
  NighttimeIntervalInvalidException,
  DailyLimitExceededException,
  MonthlyLimitExceededException,
  YearlyLimitExceededException,
  NightlyLimitExceededException,
  UserLimitEventEmitter,
  MaxAmountLimitExceededException,
  MaxAmountNightlyLimitExceededException,
  MinAmountLimitBelowException,
  MinAmountNightlyLimitBelowException,
} from '@zro/operations/application';

export class UpdateUserLimitUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitRepository User Limit repository.
   * @param globalLimitRepository Global Limit repository.
   * @param limitTypeRepository Limit Type repoitory.
   * @param userLimitEventEmitter User Limit event emitter.
   * @param nighttimeIntervals Night time intervals.
   */
  constructor(
    private logger: Logger,
    private userLimitRepository: UserLimitRepository,
    private globalLimitRepository: GlobalLimitRepository,
    private limitTypeRepository: LimitTypeRepository,
    private userLimitEventEmitter: UserLimitEventEmitter,
    private nighttimeIntervals: string,
  ) {
    logger.child({ context: UpdateUserLimitUseCase.name });
  }

  async execute(
    user: User,
    limitTypes: LimitType[],
    newLimits: UserLimitEntity,
  ): Promise<UserLimit[]> {
    const userLimitsUpdated = await Promise.all(
      limitTypes.map((limitType) =>
        this.updateUserLimit(user, limitType, newLimits),
      ),
    );

    return userLimitsUpdated;
  }

  private async updateUserLimit(
    user: User,
    limitType: LimitType,
    newLimits: UserLimitEntity,
  ) {
    const userLimit = await this.getLimit(user, limitType);

    this.logger.debug('UserLimit found.', { userLimit });

    const limitTypeFound = await this.limitTypeRepository.getById(limitType.id);

    this.logger.debug('Limit type found.', { limitTypeFound });

    if (newLimits.userDailyLimit) {
      if (newLimits.userDailyLimit <= userLimit.dailyLimit) {
        userLimit.userDailyLimit = newLimits.userDailyLimit;
      } else {
        throw new DailyLimitExceededException(
          newLimits.userDailyLimit,
          userLimit.dailyLimit,
        );
      }
    }

    if (newLimits.userMonthlyLimit) {
      if (newLimits.userMonthlyLimit <= userLimit.monthlyLimit) {
        userLimit.userMonthlyLimit = newLimits.userMonthlyLimit;
      } else {
        throw new MonthlyLimitExceededException(
          newLimits.userMonthlyLimit,
          userLimit.monthlyLimit,
        );
      }
    }

    if (newLimits.userYearlyLimit) {
      if (newLimits.userYearlyLimit <= userLimit.yearlyLimit) {
        userLimit.userYearlyLimit = newLimits.userYearlyLimit;
      } else {
        throw new YearlyLimitExceededException(
          newLimits.userYearlyLimit,
          userLimit.yearlyLimit,
        );
      }
    }

    if (newLimits.userNightlyLimit) {
      if (newLimits.userNightlyLimit <= userLimit.nightlyLimit) {
        userLimit.userNightlyLimit = newLimits.userNightlyLimit;
      } else {
        throw new NightlyLimitExceededException(
          newLimits.userNightlyLimit,
          userLimit.nightlyLimit,
        );
      }
    }

    if (newLimits.userMaxAmount) {
      this.verifyUserMaxAmount(newLimits.userMaxAmount, userLimit);
      userLimit.userMaxAmount = newLimits.userMaxAmount;
    }

    if (newLimits.userMaxAmountNightly) {
      this.verifyUserMaxAmountNightly(
        newLimits.userMaxAmountNightly,
        userLimit,
      );

      userLimit.userMaxAmountNightly = newLimits.userMaxAmountNightly;
    }

    if (newLimits.userMinAmount) {
      this.verifyUserMinAmount(newLimits.userMinAmount, userLimit);
      userLimit.userMinAmount = newLimits.userMinAmount;
    }

    if (newLimits.userMinAmountNightly) {
      this.verifyUserMinAmountNightly(
        newLimits.userMinAmountNightly,
        userLimit,
      );

      userLimit.userMinAmountNightly = newLimits.userMinAmountNightly;
    }

    // Is to update nighttime interval?
    if (newLimits.hasNighttime()) {
      const canUpdateNighttimeInterval = this.isValidNighttimesInterval(
        newLimits.nighttimeStart,
        newLimits.nighttimeEnd,
      );

      if (!canUpdateNighttimeInterval) {
        throw new NighttimeIntervalInvalidException(newLimits);
      }

      userLimit.nighttimeStart = newLimits.nighttimeStart;
      userLimit.nighttimeEnd = newLimits.nighttimeEnd;
    }

    // Update the user limit
    const userLimitUpdated = await this.userLimitRepository.update(userLimit);

    this.userLimitEventEmitter.updatedUserLimit(userLimitUpdated);

    return userLimitUpdated;
  }

  /**
   * Get or create a user limit.
   *
   * @param user Limit owner.
   * @param limitType Limit
   * @returns Limit found or a new one.
   * @throws Limit has not default values.
   */
  private async getLimit(user: User, limitType: LimitType): Promise<UserLimit> {
    // Get user's limit
    const userLimit = await this.userLimitRepository.getByUserAndLimitType(
      user,
      limitType,
    );

    // Does user have limit?
    if (userLimit) {
      return userLimit;
    }

    // Get default limits
    const globalLimit =
      await this.globalLimitRepository.getByLimitType(limitType);

    // Sanity check.
    if (!globalLimit) {
      throw new DataException(['Missing global limit for ' + limitType.tag]);
    }

    const {
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
      maxAmountNightly,
      minAmountNightly,
      userMaxAmount,
      userMinAmount,
      userMaxAmountNightly,
      userMinAmountNightly,
      userNightlyLimit,
      userDailyLimit,
      userMonthlyLimit,
      userYearlyLimit,
      nighttimeEnd,
      nighttimeStart,
    } = globalLimit;

    // Create a default limit.
    const newUserLimit = new UserLimitEntity({
      id: uuidV4(),
      user,
      limitType,
      nightlyLimit,
      dailyLimit,
      monthlyLimit,
      yearlyLimit,
      maxAmount,
      minAmount,
      maxAmountNightly,
      minAmountNightly,
      userMaxAmount,
      userMinAmount,
      userMaxAmountNightly,
      userMinAmountNightly,
      userNightlyLimit,
      userDailyLimit,
      userMonthlyLimit,
      userYearlyLimit,
      nighttimeEnd,
      nighttimeStart,
    });

    const userLimitCreated =
      await this.userLimitRepository.create(newUserLimit);

    this.userLimitEventEmitter.createdUserLimit(newUserLimit);

    return userLimitCreated;
  }

  private isValidNighttimesInterval(
    nighttimeStart: string,
    nighttimeEnd: string,
  ): boolean {
    return this.nighttimeIntervals.includes(
      `${nighttimeStart};${nighttimeEnd}`,
    );
  }

  private verifyUserMaxAmount(
    newUserMaxAmount: number,
    userLimit: UserLimit,
  ): void {
    // Check if user max amount is above compliance max amount allowed.
    if (userLimit.maxAmount && newUserMaxAmount > userLimit.maxAmount) {
      throw new MaxAmountLimitExceededException(
        newUserMaxAmount,
        userLimit.maxAmount,
      );
    }

    // Check if user max amount is below compliance min amount allowed.
    if (userLimit.minAmount && newUserMaxAmount < userLimit.minAmount) {
      throw new MinAmountLimitBelowException(
        newUserMaxAmount,
        userLimit.minAmount,
      );
    }

    // Check if user max amount is below user defined min amount allowed.
    if (userLimit.userMinAmount && newUserMaxAmount < userLimit.userMinAmount) {
      throw new MinAmountLimitBelowException(
        newUserMaxAmount,
        userLimit.userMinAmount,
      );
    }
  }

  private verifyUserMaxAmountNightly(
    newUserMaxAmountNightly: number,
    userLimit: UserLimit,
  ) {
    // Check if user max amount nightly is above compliance max amount nightly allowed.
    if (
      userLimit.maxAmountNightly &&
      newUserMaxAmountNightly > userLimit.maxAmountNightly
    ) {
      throw new MaxAmountNightlyLimitExceededException(
        newUserMaxAmountNightly,
        userLimit.maxAmountNightly,
      );
    }

    // Check if user max amount nightly is below compliance min amount nightly allowed.
    if (
      userLimit.minAmountNightly &&
      newUserMaxAmountNightly < userLimit.minAmountNightly
    ) {
      throw new MinAmountLimitBelowException(
        newUserMaxAmountNightly,
        userLimit.minAmountNightly,
      );
    }

    // Check if user max amount nightly is below user defined min amount nightly allowed.
    if (
      userLimit.userMinAmountNightly &&
      newUserMaxAmountNightly < userLimit.userMinAmountNightly
    ) {
      throw new MinAmountLimitBelowException(
        newUserMaxAmountNightly,
        userLimit.userMinAmountNightly,
      );
    }
  }

  private verifyUserMinAmount(
    newUserMinAmount: number,
    userLimit: UserLimit,
  ): void {
    // Check if user min amount is below compliance min amount allowed.
    if (userLimit.minAmount && newUserMinAmount < userLimit.minAmount) {
      throw new MinAmountLimitBelowException(
        newUserMinAmount,
        userLimit.minAmount,
      );
    }

    // Check if user min amount is above compliance max amount allowed.
    if (userLimit.maxAmount && newUserMinAmount > userLimit.maxAmount) {
      throw new MaxAmountLimitExceededException(
        newUserMinAmount,
        userLimit.maxAmount,
      );
    }

    // Check if user min amount is above user defined max amount allowed.
    if (userLimit.userMaxAmount && newUserMinAmount > userLimit.userMaxAmount) {
      throw new MaxAmountLimitExceededException(
        newUserMinAmount,
        userLimit.userMaxAmount,
      );
    }
  }

  private verifyUserMinAmountNightly(
    newUserMinAmountNightly: number,
    userLimit: UserLimit,
  ): void {
    // Check if user min amount nightly is below compliance min amount nightly allowed.
    if (
      userLimit.minAmountNightly &&
      newUserMinAmountNightly < userLimit.minAmountNightly
    ) {
      throw new MinAmountNightlyLimitBelowException(
        newUserMinAmountNightly,
        userLimit.minAmountNightly,
      );
    }

    // Check if user min amount nightly is above compliance max amount nightly allowed.
    if (
      userLimit.maxAmountNightly &&
      newUserMinAmountNightly > userLimit.maxAmountNightly
    ) {
      throw new MaxAmountLimitExceededException(
        newUserMinAmountNightly,
        userLimit.maxAmountNightly,
      );
    }

    // Check if user min amount nightly is above user defined max amount nightly allowed.
    if (
      userLimit.userMaxAmountNightly &&
      newUserMinAmountNightly > userLimit.userMaxAmountNightly
    ) {
      throw new MaxAmountLimitExceededException(
        newUserMinAmountNightly,
        userLimit.userMaxAmountNightly,
      );
    }
  }
}
