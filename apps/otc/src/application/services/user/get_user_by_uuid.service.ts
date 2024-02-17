import { User } from '@zro/users/domain';

export type GetUserByUuidServiceRequest = Pick<User, 'uuid'>;
export type GetUserByUuidServiceResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'document'
  | 'fullName'
  | 'phoneNumber'
  | 'pin'
  | 'type'
  | 'pinHasCreated'
  | 'active'
>;

export interface GetUserByUuidRequestService {
  /**
   * Get user by uuid.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByUuid(
    request: GetUserByUuidServiceRequest,
  ): Promise<GetUserByUuidServiceResponse>;
}
