import { User } from '@zro/users/domain';

export interface UserService {
  /**
   * Get user by uuid.
   * @param uuid The user uuid.
   * @returns User found or null.
   */
  getByUuid(uuid: User['uuid']): Promise<User>;
}
