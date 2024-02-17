import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, Wallet, WalletAccount } from '@zro/operations/domain';

export type TGetWalletAccountFilter = {
  currencySymbol?: Currency['symbol'];
};

export interface WalletAccountRepository {
  /**
   * Update a wallet account.
   *
   * @param walletAccount Account to be updated.
   * @returns Updated wallet account.
   */
  update: (walletAccount: WalletAccount) => Promise<WalletAccount>;

  /**
   * Get wallet account by ID.
   *
   * @param id Wallet account ID.
   * @returns Wallet account if found or null otherwise.
   */
  getById: (id: number) => Promise<WalletAccount>;

  /**
   * Get wallet account by wallet and currency.
   *
   * @param user Wallet owner.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  getByUserAndCurrency: (
    user: User,
    currency: Currency,
  ) => Promise<WalletAccount>;

  /**
   * Get wallet account by accountNumber and currency.
   *
   * @param accountNumber Wallet account accountNumber.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  getByAccountNumberAndCurrency: (
    accountNumber: string,
    currency: Currency,
  ) => Promise<WalletAccount>;

  /**
   * Get wallet account by wallet and currency.
   *
   * @param wallet Wallet.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  getByWalletAndCurrency: (
    wallet: Wallet,
    currency: Currency,
  ) => Promise<WalletAccount>;

  /**
   * Get all wallet account by filter.
   * @param wallet Wallet's wallet account.
   * @param pagination Pagination.
   * @param filter TGetWalletAccountFilter.
   * @returns pagination response.
   */
  getByWalletAndFilter: (
    wallet: Wallet,
    pagination: Pagination,
    filter: TGetWalletAccountFilter,
  ) => Promise<TPaginationResponse<WalletAccount>>;

  /**
   * Get wallet account by wallet and uuid.
   * @param wallet Wallet's wallet account.
   * @param uuid Wallet account uuid.
   * @returns Wallet Account or null otherwise.
   */
  getByWalletAndUuid: (
    wallet: Wallet,
    uuid: WalletAccount['uuid'],
  ) => Promise<WalletAccount>;

  /**
   * Create a wallet account.
   *
   * @param walletAccount Account to be created.
   * @returns Created wallet account.
   */
  create: (walletAccount: WalletAccount) => Promise<WalletAccount>;
}
