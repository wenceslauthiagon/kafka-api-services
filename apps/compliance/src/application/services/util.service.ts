import { UserWithdrawSettingRequest } from '@zro/compliance/domain';
import { UserWithdrawSetting } from '@zro/utils/domain';
import { Wallet } from '@zro/operations/domain';

export interface UtilService {
  /**
   * Create user withdraw setting.
   * @param userWithdrawSettingRequest The user withdraw setting request.
   * @returns User limit withdraw setting request created.
   */
  createUserWithdrawSetting(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSetting>;

  /**
   * Get user withdraw setting.
   * @param wallet The user withdraw setting wallet.
   * @returns User limit withdraw setting request created.
   */
  getAllByWalletUserWithdrawSetting(
    wallet: Wallet,
  ): Promise<UserWithdrawSetting[]>;
}
