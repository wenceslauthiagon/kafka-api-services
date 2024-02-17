import { UserLimit } from '@zro/operations/domain';
import { GetUserLimitByIdAndUserResponse } from '@zro/operations/interface';
import { User } from '@zro/users/domain';

export interface UserLimitRequestService {
  /**
   * Get user limit.
   * @param userLimit The user limit to found.
   * @returns User limit found or null.
   */
  getUserLimit(
    user: User,
    userLimit: UserLimit,
  ): Promise<GetUserLimitByIdAndUserResponse>;
}
