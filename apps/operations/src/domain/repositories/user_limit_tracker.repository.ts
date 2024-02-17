import { Pagination, TPaginationResponse } from '@zro/common';
import {
  LimitTypePeriodStart,
  UserLimit,
  UserLimitTracker,
} from '@zro/operations/domain';

export enum UserLimitTrackerRequestSort {
  CREATED_AT = 'created_at',
}

export interface UserLimitTrackerRepository {
  /**
   * Create UserLimitTracker.
   *
   * @param userLimitTracker New UserLimitTracker.
   * @returns Created UserLimitTracker.
   */
  create: (userLimitTracker: UserLimitTracker) => Promise<UserLimitTracker>;

  /**
   * Create or update UserLimitTracker.
   *
   * @param userLimitTracker New or existing UserLimitTracker.
   * @returns Created or updated UserLimitTracker.
   */
  createOrUpdate: (
    userLimitTracker: UserLimitTracker,
  ) => Promise<UserLimitTracker>;

  /**
   * Update UserLimitTracker.
   *
   * @param userLimitTracker UserLimitTracker.
   * @returns Updated UserLimitTracker.
   */
  update: (userLimitTracker: UserLimitTracker) => Promise<UserLimitTracker>;

  /**
   * Get UserLimitTracker by id.
   *
   * @param id id of UserLimitTracker.
   * @returns UserLimitTracker if found or null otherwise.
   */
  getById: (id: string) => Promise<UserLimitTracker>;

  /**
   * Get UserLimitTracker by UserLimit.
   *
   * @param userLimit UserLimit.
   * @returns UserLimitTracker if found or null otherwise.
   */
  getByUserLimit: (userLimit: UserLimit) => Promise<UserLimitTracker>;

  /**
   * Get all UserLimitTrackers.
   * @param pagination Pagination.
   * @returns Operations[]
   */
  getAllFilledByPaginationAndPeriodStart: (
    pagination: Pagination,
    periodStart: LimitTypePeriodStart,
  ) => Promise<TPaginationResponse<UserLimitTracker>>;
}
