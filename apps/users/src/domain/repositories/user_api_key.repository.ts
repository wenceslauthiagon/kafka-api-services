import { User, UserApiKey } from '@zro/users/domain';

export interface UserApiKeyRepository {
  /**
   * Get user api key by id.
   * @param id User id.
   * @returns User api key found or null otherwise.
   */
  getById(id: string): Promise<UserApiKey>;

  /**
   * Get user api key by user.
   * @param user User.
   * @returns User api key found or null otherwise.
   */
  getByUser(user: User): Promise<UserApiKey>;

  /**
   * Create user api key.
   * @param userApiKey User api key object.
   * @returns User api key created.
   */
  create(userApiKey: UserApiKey): Promise<UserApiKey>;

  /**
   * Update user api key.
   * @param userApiKey User api key object.
   * @returns User api key updated.
   */
  update(userApiKey: UserApiKey): Promise<UserApiKey>;
}
