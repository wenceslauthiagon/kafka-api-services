import {
  PendingWalletAccountTransaction,
  WalletAccount,
} from '@zro/operations/domain';

export interface PendingWalletAccountTransactionRepository {
  /**
   * Create pending wallet account.
   *
   * @param walletAccountTransaction New walletAccountTransaction.
   * @returns Created walletAccountTransaction.
   */
  create: (
    walletAccountTransaction: PendingWalletAccountTransaction,
  ) => Promise<PendingWalletAccountTransaction>;

  /**
   * Update pending wallet account.
   *
   * @param walletAccountTransaction New walletAccountTransaction.
   * @returns Created walletAccountTransaction.
   */
  update: (
    walletAccountTransaction: PendingWalletAccountTransaction,
  ) => Promise<PendingWalletAccountTransaction>;

  /**
   * Get by walletAccount.
   * @param walletAccount WalletAccount.
   * @returns PendingWalletAccountTransaction found or null otherwise.
   */
  getByWalletAccount: (
    walletAccount: WalletAccount,
  ) => Promise<PendingWalletAccountTransaction[]>;
}
