import { UserLimitRequest } from '@zro/compliance/domain';

export interface UserLimitRequestRepository {
  /**
   * Create user limit request.
   * @param userLimitRequest User limit request object.
   * @returns User limit request created.
   */
  create: (userLimitRequest: UserLimitRequest) => Promise<UserLimitRequest>;

  /**
   * Get user limit request by id.
   * @param id User limit request id.
   * @returns User limit request found or null otherwise.
   */
  getById: (id: string) => Promise<UserLimitRequest>;

  /**
   * Update user limit request.
   * @param userLimitRequest User limit request to be update.
   * @returns User limit updated.
   */
  update: (userLimitRequest: UserLimitRequest) => Promise<UserLimitRequest>;
}
