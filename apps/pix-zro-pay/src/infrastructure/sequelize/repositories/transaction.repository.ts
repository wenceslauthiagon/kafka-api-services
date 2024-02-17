import { DatabaseRepository } from '@zro/common';
import { Transaction, TransactionRepository } from '@zro/pix-zro-pay/domain';
import { TransactionModel } from '@zro/pix-zro-pay/infrastructure';

export class TransactionDatabaseRepository
  extends DatabaseRepository
  implements TransactionRepository
{
  static toDomain(transactionModel: TransactionModel): Transaction {
    return transactionModel?.toDomain() ?? null;
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const transactionGenerated =
      await TransactionModel.create<TransactionModel>(transaction, {
        transaction: this.transaction,
      });

    transaction.createdAt = transactionGenerated.createdAt;
    return transaction;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    await TransactionModel.update<TransactionModel>(transaction, {
      where: { id: transaction.id },
      transaction: this.transaction,
    });

    return transaction;
  }

  async getById(id: number): Promise<Transaction> {
    return TransactionModel.findOne<TransactionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(TransactionDatabaseRepository.toDomain);
  }

  async getByUuid(uuid: string): Promise<Transaction> {
    return TransactionModel.findOne<TransactionModel>({
      where: {
        uuid,
      },
      transaction: this.transaction,
    }).then(TransactionDatabaseRepository.toDomain);
  }
}
