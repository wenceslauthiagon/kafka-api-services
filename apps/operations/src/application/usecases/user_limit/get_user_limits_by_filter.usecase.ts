import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  GlobalLimitRepository,
  LimitType,
  LimitTypeEntity,
  LimitTypeRepository,
  UserLimit,
  UserLimitEntity,
  UserLimitFilter,
  UserLimitRepository,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  DataException,
  UserLimitEventEmitter,
} from '@zro/operations/application';

export class GetUserLimitsByFilterUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param userLimitRepository User Limit repository.
   * @param globalLimitRepository Global Limit repository.
   * @param limitTypeRepository Limit type repository.
   * @param userLimitEventEmitter User Limit event emitter.
   */
  constructor(
    private logger: Logger,
    private userLimitRepository: UserLimitRepository,
    private globalLimitRepository: GlobalLimitRepository,
    private limitTypeRepository: LimitTypeRepository,
    private userLimitEventEmitter: UserLimitEventEmitter,
  ) {
    logger.child({ context: GetUserLimitsByFilterUseCase.name });
  }

  async execute(filter: UserLimitFilter): Promise<UserLimit[]> {
    // Data input check
    if (!filter?.userId) {
      throw new MissingDataException(['UserId']);
    }

    const { userId, limitTypeId } = filter;

    const user = new UserEntity({ id: userId });

    if (!limitTypeId) {
      const limitTypesFound = await this.limitTypeRepository.getAll();

      this.logger.debug('Limit Types found', { limitTypesFound });

      const userLimitsFound = await Promise.all(
        limitTypesFound.map(async (limitTypeFound) => {
          const userLimitFound = await this.getLimit(user, limitTypeFound);

          userLimitFound.limitType = limitTypeFound;

          return userLimitFound;
        }),
      );

      this.logger.debug('User limits found.', { userLimitsFound });

      return userLimitsFound;
    }

    const limitType = new LimitTypeEntity({ id: limitTypeId });

    const limitTypeFound = await this.limitTypeRepository.getById(limitType.id);

    const userLimitFound = await this.getLimit(user, limitType);

    userLimitFound.limitType = limitTypeFound;

    this.logger.debug('User limit found.', { userLimitFound });

    return [userLimitFound];
  }

  /**
   * Get or create a user limit.
   *
   * @param user Limit owner.
   * @param limitType Limit
   * @returns Limit found or a new one.
   * @throws Limit has not default values.
   */
  async getLimit(user: User, limitType: LimitType): Promise<UserLimit> {
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

    const createdUserLimit =
      await this.userLimitRepository.create(newUserLimit);

    this.userLimitEventEmitter.createdUserLimit(newUserLimit);

    return createdUserLimit;
  }
}
