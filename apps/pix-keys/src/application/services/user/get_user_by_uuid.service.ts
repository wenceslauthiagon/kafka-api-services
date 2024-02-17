import { User } from '@zro/users/domain';

export type GetUserByUuidRequest = Pick<User, 'uuid'>;
export type GetUserByUuidResponse = Pick<
  User,
  'id' | 'uuid' | 'document' | 'fullName' | 'active' | 'type'
>;

export interface GetUserByUuidRequestService {
  /**
   * Get user by uuid.
   * @param user The user.
   * @returns User if found or null otherwise.
   */
  getUserByUuid(request: GetUserByUuidRequest): Promise<GetUserByUuidResponse>;
}
