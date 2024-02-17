import { User } from '@zro/users/domain';

export type CreateUserRequest = Pick<
  User,
  'name' | 'phoneNumber' | 'referralCode' | 'password' | 'email'
> & {
  id: User['uuid'];
  confirmCode: string;
};

export interface CreateUserResponse {
  id: User['uuid'];
}

export type GetUserByEmailRequest = Pick<User, 'email'>;
export type GetUserByEmailResponse = Pick<User, 'id' | 'uuid'>;

export interface UserService {
  /**
   * Create new user.
   * @param request The user.
   * @returns Created user.
   */
  createUser(
    request: CreateUserRequest,
  ): CreateUserResponse | Promise<CreateUserResponse>;

  /**
   * Get user by email.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByEmail(
    request: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse>;
}
