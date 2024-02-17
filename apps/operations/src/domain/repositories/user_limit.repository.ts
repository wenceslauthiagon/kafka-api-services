import { Pagination, TPaginationResponse } from '@zro/common';
import { LimitType, UserLimit } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface UserLimitFilter {
  userId: User['id'];
  limitTypeId?: LimitType['id'];
}

export enum UserLimitRequestSort {
  CREATED_AT = 'created_at',
}

export interface UserLimitRepository {
  /**
   * Create user limit.
   *
   * @param userLimit New userLimit.
   * @returns Created userLimit.
   */
  create: (userLimit: UserLimit) => Promise<UserLimit>;

  /**
   * Get user limits by user and limit type.
   *
   * @param user Limit owner.
   * @param limitType Limit type.
   * @returns User limit if found or null otherwise.
   */
  getByUserAndLimitType: (
    user: User,
    limitType: LimitType,
  ) => Promise<UserLimit>;

  /**
   * Get user limits by filter.
   *
   * @param filter filter.
   * @param pagination Pagination
   * @returns User limits if found or null otherwise.
   */
  getByFilter: (
    filter: UserLimitFilter,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<UserLimit>>;

  /**
   * Get user limit by id.
   *
   * @param user User of limit.
   * @param id id of limit to found.
   * @returns User limit if found or null otherwise.
   */
  getByUserAndId: (user: User, id: string) => Promise<UserLimit>;

  /**
   * Update user limits.
   *
   * @param userLimit User Limit.
   * @returns User limit updated.
   */
  update: (userLimit: UserLimit) => Promise<UserLimit>;

  /**
   * Get user limits by id.
   *
   * @param id id of user limit.
   * @returns User limit if found or null otherwise.
   */
  getById: (id: string) => Promise<UserLimit>;
}
