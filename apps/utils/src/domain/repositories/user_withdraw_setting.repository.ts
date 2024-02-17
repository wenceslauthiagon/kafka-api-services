import { UserWithdrawSetting } from '@zro/utils/domain';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import { Pagination, TPaginationResponse } from '@zro/common';

export type WithdrawFilter = {
  type: UserWithdrawSetting['type'];
  day?: UserWithdrawSetting['day'];
  weekDay?: UserWithdrawSetting['weekDay'];
};

export interface UserWithdrawSettingRepository {
  /**
   * Create user withdraw setting.
   * @param userWithdrawSetting User withdraw setting bject.
   * @returns User withdraw setting created.
   */
  create: (
    userWithdrawSetting: UserWithdrawSetting,
  ) => Promise<UserWithdrawSetting>;

  /**
   * Get user withdraw setting by id.
   * @param id User withdraw setting id.
   * @returns User withdraw setting found or null otherwise.
   */
  getById: (id: string) => Promise<UserWithdrawSetting>;

  /**
   * Get user withdraw setting by user and id.
   * @param user user withdraw setting request user.
   * @param id User withdraw setting request id.
   * @returns User withdraw setting request found or null otherwise.
   */
  getByUserAndId: (user: User, id: string) => Promise<UserWithdrawSetting>;

  /**
   * Get all user withdraw setting by filter.
   * @param withdrawFilter Filter.
   * @returns User withdraw setting list.
   */
  getAllActiveByFilter: (
    withdrawFilter: WithdrawFilter,
  ) => Promise<UserWithdrawSetting[]>;

  /**
   * Get all user withdraw by wallet
   * @param user User.
   * @param wallet Wallet.
   * @param pagination Pagination.
   * @returns User withdraw setting list.
   */
  getAllByPaginationAndWallet: (
    wallet: Wallet,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<UserWithdrawSetting>>;

  /**
   * Update user withdraw
   * @param userWithdrawSetting
   * @returns User withdraw setting
   */
  update: (
    userWithdrawSetting: UserWithdrawSetting,
  ) => Promise<UserWithdrawSetting>;
}
