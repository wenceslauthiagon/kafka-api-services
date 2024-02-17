import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  LimitTypePeriodStart,
  UserLimit,
  UserLimitTracker,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import { UserLimitTrackerModel } from '@zro/operations/infrastructure';
import { Op } from 'sequelize';

export class UserLimitTrackerDatabaseRepository
  extends DatabaseRepository
  implements UserLimitTrackerRepository
{
  /**
   * Convert UserLimitTracker model to UserLimitTracker domain.
   * @param userLimitTracker Model instance.
   * @returns {Domain instance.
   */
  static toDomain(userLimitTracker: UserLimitTrackerModel): UserLimitTracker {
    return userLimitTracker?.toDomain() ?? null;
  }

  /**
   * Create UserLimitTracker.
   *
   * @param userLimitTracker New UserLimitTracker.
   * @returns Created UserLimitTracker.
   */
  async create(userLimitTracker: UserLimitTracker): Promise<UserLimitTracker> {
    const createdUserLimitTracker = await UserLimitTrackerModel.create(
      userLimitTracker,
      {
        transaction: this.transaction,
      },
    );

    userLimitTracker.id = createdUserLimitTracker.id;
    userLimitTracker.createdAt = createdUserLimitTracker.createdAt;

    return userLimitTracker;
  }

  /**
   * Create or update UserLimitTracker.
   *
   * @param userLimitTracker New or existing UserLimitTracker.
   * @returns Created or updated UserLimitTracker.
   */
  async createOrUpdate(
    userLimitTracker: UserLimitTracker,
  ): Promise<UserLimitTracker> {
    // If the user limit tracker exists, update the existing record. If not, create a new one.
    const existingUserLimitTracker = await UserLimitTrackerModel.findOne({
      where: { id: userLimitTracker.id },
      transaction: this.transaction,
    });

    if (existingUserLimitTracker) {
      await UserLimitTrackerModel.update(userLimitTracker, {
        where: {
          id: userLimitTracker.id,
        },
        transaction: this.transaction,
      });

      return userLimitTracker;
    } else {
      const createdUserLimitTracker = await UserLimitTrackerModel.create(
        userLimitTracker,
        {
          transaction: this.transaction,
        },
      );

      userLimitTracker.id = createdUserLimitTracker.id;
      userLimitTracker.createdAt = createdUserLimitTracker.createdAt;

      return userLimitTracker;
    }
  }

  /**
   * Update UserLimitTracker.
   *
   * @param userLimitTracker UserLimitTracker.
   * @returns Updated UserLimitTracker.
   */
  async update(userLimitTracker: UserLimitTracker): Promise<UserLimitTracker> {
    await UserLimitTrackerModel.update(userLimitTracker, {
      where: {
        id: userLimitTracker.id,
      },
      transaction: this.transaction,
    });

    return userLimitTracker;
  }

  /**
   * Get UserLimitTracker by id.
   *
   * @param id UserLimitTracker ID.
   * @returns UserLimitTracker if found or null otherwise.
   */
  async getById(id: string): Promise<UserLimitTracker> {
    return UserLimitTrackerModel.findOne({
      where: {
        id,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(UserLimitTrackerDatabaseRepository.toDomain);
  }

  /**
   * Get UserLimitTracker by UserLimit.
   *
   * @param userLimit UserLimit.
   * @returns UserLimitTracker if found or null otherwise.
   */
  async getByUserLimit(userLimit: UserLimit): Promise<UserLimitTracker> {
    return UserLimitTrackerModel.findOne({
      where: {
        userLimitId: userLimit.id,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(UserLimitTrackerDatabaseRepository.toDomain);
  }

  /**
   * Get all filled by pagination UserLimitTrackers.
   * @param pagination Pagination.
   * @returns UserLimitTrackers found.
   */
  async getAllFilledByPaginationAndPeriodStart(
    pagination: Pagination,
    periodStart: LimitTypePeriodStart,
  ): Promise<TPaginationResponse<UserLimitTracker>> {
    return UserLimitTrackerModel.findAndCountAll<UserLimitTrackerModel>({
      ...paginationWhere(pagination),
      where: {
        [Op.or]: [
          { usedDailyLimit: { [Op.gt]: 0 } },
          { usedMonthlyLimit: { [Op.gt]: 0 } },
          { usedAnnualLimit: { [Op.gt]: 0 } },
          { usedNightlyLimit: { [Op.gt]: 0 } },
        ],
        periodStart,
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(UserLimitTrackerDatabaseRepository.toDomain),
      ),
    );
  }
}
