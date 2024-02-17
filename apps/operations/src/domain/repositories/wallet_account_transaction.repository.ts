import { Operation, WalletAccountTransaction } from '@zro/operations/domain';

export interface WalletAccountTransactionRepository {
  /**
   * Create wallet account transaction.
   *
   * @param walletAccountTransaction New account transaction.
   * @returns reated account transaction.
   */
  create: (
    walletAccountTransaction: WalletAccountTransaction,
  ) => Promise<WalletAccountTransaction>;

  /**
   * Get wallet account transaction by operation.
   *
   * @param operation Operation.
   * @returns related account transaction.
   */
  getByOperation: (operation: Operation) => Promise<WalletAccountTransaction>;
}
