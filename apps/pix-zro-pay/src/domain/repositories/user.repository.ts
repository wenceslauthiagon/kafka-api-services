import { User } from '@zro/pix-zro-pay/domain';

export interface UserRepository {
  /**
   * Insert a User.
   * @param user User to save.
   * @returns Created User.
   */
  create(user: User): Promise<User>;

  /**
   * Update a User.
   * @param user User to update.
   * @returns Updated user.
   */
  update(user: User): Promise<User>;

  /**
   * get a User by id.
   * @param id User id to get.
   * @returns get User.
   */
  getById(id: number): Promise<User>;
}
