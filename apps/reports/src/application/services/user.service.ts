import { User } from '@zro/users/domain';

export interface UserService {
  /**
   * Get user by uuid.
   * @param document The document user.
   * @returns User if found or null otherwise.
   */
  getUserByDocument(document: User['document']): Promise<User>;
}
