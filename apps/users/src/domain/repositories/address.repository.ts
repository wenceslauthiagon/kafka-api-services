import { Address, User } from '@zro/users/domain';

export interface AddressRepository {
  /**
   * Get address by id.
   * @param id The address id.
   * @returns The address.
   */
  getById(id: number): Promise<Address>;

  /**
   * Get address by user.
   * @param user The user.
   * @returns The address.
   */
  getByUser(user: User): Promise<Address>;
}
