import { User } from '@zro/users/domain';

export type GetUserByUuidServiceRequest = Pick<User, 'uuid'>;
export type GetUserByUuidServiceResponse = Pick<
  User,
  'id' | 'uuid' | 'active' | 'fcmToken'
>;

export interface GetUserByUuidRequestService {
  /**
   * Get user by uuid.
   * @param user The user.
   * @returns User if found or null otherwise.
   */
  getUserByUuid(
    user: GetUserByUuidServiceRequest,
  ): Promise<GetUserByUuidServiceResponse>;
}
