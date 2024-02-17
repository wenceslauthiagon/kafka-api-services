import { User } from '@zro/users/domain';
import { Wallet, WalletAccount } from '@zro/operations/domain';

export interface WalletAccountCacheRepository {
  /**
   * Get all wallet account cache by user.
   * @param user Wallet's wallet account cache.
   * @returns wallet account cache response.
   */
  getAllByUser: (user: User) => Promise<WalletAccount[]>;

  /**
   * Get all wallet account cache by wallet.
   *
   * @param wallet Wallet.
   * @returns wallet account cache response.
   */
  getAllByWallet: (wallet: Wallet) => Promise<WalletAccount[]>;

  /**
   * Get wallet account cache by ID.
   * @param id wallet account in cache.
   * @returns wallet account in cache response.
   */
  getById: (id: number) => Promise<WalletAccount>;
}
