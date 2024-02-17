import { User, UserLegalAdditionalInfo } from '@zro/users/domain';

export interface UserLegalAdditionalInfoRepository {
  /**
   * Get user legal additional info by user.
   * @param user The user.
   * @returns The additional info.
   */
  getByUser(user: User): Promise<UserLegalAdditionalInfo>;
}
