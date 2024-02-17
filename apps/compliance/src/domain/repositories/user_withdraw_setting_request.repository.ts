import { UserWithdrawSettingRequest } from '@zro/compliance/domain';
import { User } from '@zro/users/domain';

export interface UserWithdrawSettingRequestRepository {
  /**
   * Create user withdraw setting request.
   * @param userWithdrawSettingsRequest User withdraw setting request object.
   * @returns User withdraw setting request created.
   */
  create: (
    userWithdrawSettingsRequest: UserWithdrawSettingRequest,
  ) => Promise<UserWithdrawSettingRequest>;

  /**
   * Get user withdraw setting request by id.
   * @param id User withdraw setting request id.
   * @returns User withdraw setting request found or null otherwise.
   */
  getById: (id: string) => Promise<UserWithdrawSettingRequest>;

  /**
   * Update user withdraw setting request.
   * @param userWithdrawSettingsRequest User withdraw setting request to be update.
   * @returns User withdraw setting request updated.
   */
  update: (
    userWithdrawSettingsRequest: UserWithdrawSettingRequest,
  ) => Promise<UserWithdrawSettingRequest>;

  /**
   * Get user withdraw setting request by user and id.
   * @param user user withdraw setting request user.
   * @param id User withdraw setting request id.
   * @returns User withdraw setting request found or null otherwise.
   */
  getByUserAndId: (
    user: User,
    id: string,
  ) => Promise<UserWithdrawSettingRequest>;
}
