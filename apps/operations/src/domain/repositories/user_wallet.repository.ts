import { User } from '@zro/users/domain';
import { Wallet, UserWallet } from '@zro/operations/domain';

export interface UserWalletRepository {
  /**
   * Create user wallet.
   * @returns User wallet created.
   */
  create(userWallet: UserWallet): Promise<UserWallet>;

  /**
   * Update user wallet.
   *
   * @param userWallet User wallet object.
   * @returns User wallet updated.
   */
  update(userWallet: UserWallet): Promise<UserWallet>;

  /**
   * Get user wallets by user.
   * @param user User id.
   * @returns User wallets found or null otherwise.
   */
  getAllByUser(user: User): Promise<UserWallet[]>;

  /**
   * Get user wallet by user and wallet.
   * @param user User.
   * @param wallet Wallet.
   * @returns User wallet if found or null otherwise.
   */
  getByUserAndWallet(user: User, wallet: Wallet): Promise<UserWallet>;

  /**
   * Get user wallets by wallet.
   * @param wallet Wallet.
   * @returns User wallet if found or null otherwise.
   */
  getAllByWallet(wallet: Wallet): Promise<UserWallet[]>;

  /**
   * Delete user wallet.
   * @param wallet wallet object.
   * @returns Number of deleted.
   */
  deleteByWallet(wallet: Wallet): Promise<number>;

  /**
   * Delete user wallet by user and wallet.
   * @param user User.
   * @param wallet Wallet.
   * @returns Number of deleted.
   */
  deleteByUserAndWallet(user: User, wallet: Wallet): Promise<number>;
}
