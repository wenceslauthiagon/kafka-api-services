import { User } from '@zro/users/domain';

export type GetUserByUuidRequest = { userId: User['uuid'] };
export type GetUserByUuidResponse = Pick<
  User,
  'id' | 'uuid' | 'name' | 'email' | 'phoneNumber'
>;

export type GetUserByPhoneNumberRequest = Pick<User, 'phoneNumber'>;
export type GetUserByPhoneNumberResponse = Pick<User, 'id' | 'uuid'>;

export type GetUserByEmailRequest = Pick<User, 'email'>;
export type GetUserByEmailResponse = Pick<User, 'id' | 'uuid'>;
export interface UserService {
  /**
   * Get user by uuid.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByUuid(request: GetUserByUuidRequest): Promise<GetUserByUuidResponse>;

  /**
   * Get user by id.
   * @param request The user id.
   * @returns User if found or null otherwise.
   */
  getUserById(request: User['id']): Promise<User>;

  /**
   * Get user by phone number.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByPhoneNumber(
    request: GetUserByPhoneNumberRequest,
  ): Promise<GetUserByPhoneNumberResponse>;

  /**
   * Get user by email.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByEmail(
    request: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse>;
}
