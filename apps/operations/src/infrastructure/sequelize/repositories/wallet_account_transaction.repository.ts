import { DatabaseRepository } from '@zro/common';
import {
  Operation,
  WalletAccountTransaction,
  WalletAccountTransactionRepository,
} from '@zro/operations/domain';
import { WalletAccountTransactionModel } from '@zro/operations/infrastructure';

export class WalletAccountTransactionDatabaseRepository
  extends DatabaseRepository
  implements WalletAccountTransactionRepository
{
  /**
   * Convert WalletAccountTransaction model to WalletAccountTransaction domain.
   * @param WalletAccountTransaction Model instance.
   * @returns Domain instance.
   */
  static toDomain(
    walletAccountTransaction: WalletAccountTransactionModel,
  ): WalletAccountTransaction {
    return walletAccountTransaction?.toDomain() ?? null;
  }

  /**
   * Create wallet account transaction.
   *
   * @param walletAccountTransaction New account transaction.
   * @returns reated account transaction.
   */
  async create(
    walletAccountTransaction: WalletAccountTransaction,
  ): Promise<WalletAccountTransaction> {
    const createdWalletAccountTransaction =
      await WalletAccountTransactionModel.create<WalletAccountTransactionModel>(
        walletAccountTransaction,
        {
          transaction: this.transaction,
        },
      );

    walletAccountTransaction.id = createdWalletAccountTransaction.id;
    walletAccountTransaction.createdAt =
      createdWalletAccountTransaction.createdAt;

    return walletAccountTransaction;
  }

  /**
   * Get wallet account transaction by operation.
   *
   * @param operation Operation.
   * @returns related account transaction.
   */
  async getByOperation(
    operation: Operation,
  ): Promise<WalletAccountTransaction> {
    return WalletAccountTransactionModel.findOne<WalletAccountTransactionModel>(
      {
        where: {
          operationId: operation.id,
        },
        transaction: this.transaction,
      },
    ).then(WalletAccountTransactionDatabaseRepository.toDomain);
  }
}
