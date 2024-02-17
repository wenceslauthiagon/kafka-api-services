import { User } from '@zro/users/domain';

export type GetUserByDocumentServiceRequest = Pick<User, 'document'>;
export type GetUserByDocumentServiceResponse = Pick<
  User,
  | 'id'
  | 'uuid'
  | 'document'
  | 'fullName'
  | 'phoneNumber'
  | 'pin'
  | 'pinHasCreated'
  | 'active'
  | 'type'
>;

export interface GetUserByDocumentRequestService {
  /**
   * Get user by uuid.
   * @param request The user.
   * @returns User if found or null otherwise.
   */
  getUserByDocument(
    request: GetUserByDocumentServiceRequest,
  ): Promise<GetUserByDocumentServiceResponse>;
}
