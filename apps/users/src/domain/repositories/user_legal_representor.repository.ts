import { User, UserLegalRepresentor } from '@zro/users/domain';

export interface UserLegalRepresentorRepository {
  /**
   * Get user's legal representor by user.
   * @param user The user.
   * @returns Users legal representor
   */
  getAllByUser(user: User): Promise<UserLegalRepresentor[]>;
}
