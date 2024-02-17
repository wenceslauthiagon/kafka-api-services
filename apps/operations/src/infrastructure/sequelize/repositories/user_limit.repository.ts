import { isObject } from 'class-validator';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  LimitType,
  UserLimit,
  UserLimitFilter,
  UserLimitRepository,
} from '@zro/operations/domain';
import { LimitTypeModel, UserLimitModel } from '@zro/operations/infrastructure';

export class UserLimitDatabaseRepository
  extends DatabaseRepository
  implements UserLimitRepository
{
  /**
   * Convert UserLimit model to UserLimit domain.
   * @param userLimit Model instance.
   * @returns {Domain instance.
   */
  static toDomain(userLimit: UserLimitModel): UserLimit {
    return userLimit?.toDomain() ?? null;
  }

  /**
   * Create user limit.
   *
   * @param userLimit New userLimit.
   * @returns Created userLimit.
   */
  async create(userLimit: UserLimit): Promise<UserLimit> {
    const createdUserLImit = await UserLimitModel.create(userLimit, {
      transaction: this.transaction,
    });

    userLimit.id = createdUserLImit.id;

    return userLimit;
  }

  /**
   * Get user limits by user and limit type.
   *
   * @param user Limit owner.
   * @param limitType Limit type.
   * @returns User limit if found or null otherwise.
   */
  async getByUserAndLimitType(
    user: User,
    limitType: LimitType,
  ): Promise<UserLimit> {
    return UserLimitModel.findOne({
      where: {
        userId: user.id,
        limitTypeId: limitType.id,
      },
      transaction: this.transaction,
    }).then(UserLimitDatabaseRepository.toDomain);
  }

  /**
   * Get user limits by filter.
   *
   * @param filter filter.
   * @param pagination Pagination
   * @returns User limits if found or null otherwise.
   */
  async getByFilter(
    filter: UserLimitFilter,
    pagination: Pagination,
  ): Promise<TPaginationResponse<UserLimit>> {
    return UserLimitModel.findAndCountAll<UserLimitModel>({
      where: { ...this._filterWhere(filter) },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(UserLimitDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get user limit by user and id.
   *
   * @param user Limit owner.
   * @param id User limit id.
   * @returns User limit if found or null otherwise.
   */
  async getByUserAndId(user: User, id: string): Promise<UserLimit> {
    return UserLimitModel.findOne({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        model: LimitTypeModel,
      },
      transaction: this.transaction,
    }).then(UserLimitDatabaseRepository.toDomain);
  }

  /**
   * @param userLimit
   * @returns userLimit updated
   */
  async update(userLimit: UserLimit): Promise<UserLimit> {
    await UserLimitModel.update(userLimit, {
      where: {
        id: userLimit.id,
      },
      transaction: this.transaction,
    });

    return userLimit;
  }

  /**
   * Get user limit by id.
   *
   * @param id User limit id.
   * @returns User limit if found or null otherwise.
   */
  async getById(id: string): Promise<UserLimit> {
    return UserLimitModel.findOne({
      where: {
        id,
      },
      include: {
        model: LimitTypeModel,
      },
      transaction: this.transaction,
    }).then(UserLimitDatabaseRepository.toDomain);
  }

  private _filterWhere(filter: UserLimitFilter) {
    const entriesOfFilter = Object.entries(filter);

    const entriesWithCorrectValue = entriesOfFilter.filter(
      ([, value]) =>
        (isObject(value) && Object.keys(value).length) || value !== undefined,
    );

    const filterObject = Object.fromEntries(entriesWithCorrectValue);

    return filterObject;
  }
}
