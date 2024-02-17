import { Currency, Wallet, WalletAccount } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface OperationService {
  /**
   * Get wallet account by user and currency.
   * @param user User.
   * @param currency Currency.
   * @returns Wallet account found or null otherwise.
   */
  getWalletAccountByUserAndCurrency(
    user: User,
    currency: Currency,
  ): Promise<WalletAccount>;

  /**
   * Get Wallet Account.
   * @param wallet Data for construct param.
   * @param currency Data for construct param.
   * @returns Wallet Account.
   */
  getWalletAccountByWalletAndCurrency(
    wallet: Wallet,
    currency: Currency,
  ): Promise<WalletAccount>;
}
