import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { WarningTransactionModel } from '@zro/compliance/infrastructure';
import { Operation } from '@zro/operations/domain';

export class WarningTransactionDatabaseRepository
  extends DatabaseRepository
  implements WarningTransactionRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: WarningTransactionModel): WarningTransaction {
    return model?.toDomain() ?? null;
  }

  /**
   * Create a warning transaction.
   *
   * @param {WarningTransaction} warningTransaction warning transaction instance.
   * @returns {WarningTransaction} new WarningTransaction
   */
  async create(
    warningTransaction: WarningTransaction,
  ): Promise<WarningTransaction> {
    const createdWarningTransaction =
      await WarningTransactionModel.create<WarningTransactionModel>(
        warningTransaction,
        {
          transaction: this.transaction,
        },
      );

    warningTransaction.id = createdWarningTransaction.id;
    warningTransaction.createdAt = createdWarningTransaction.createdAt;

    return warningTransaction;
  }

  /**
   * Get warning transaction by id.
   *
   * @param {String} id Warning transaction ID.
   * @returns {WarningTransaction}
   */
  async getById(id: string): Promise<WarningTransaction> {
    return WarningTransactionModel.findOne<WarningTransactionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WarningTransactionDatabaseRepository.toDomain);
  }

  /**
   * Get warning transaction by operation ID.
   *
   * @param {String} operationId Warning transaction operationId.
   * @returns {WarningTransaction}
   */
  async getByOperation(operation: Operation): Promise<WarningTransaction> {
    return WarningTransactionModel.findOne<WarningTransactionModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(WarningTransactionDatabaseRepository.toDomain);
  }

  /**
   * Update warning transaction.
   *
   * @param {WarningTransaction} warningTransaction warning transaction instance.
   * @returns {WarningTransaction} Updated WarningTransaction
   */
  async update(
    warningTransaction: WarningTransaction,
  ): Promise<WarningTransaction> {
    await WarningTransactionModel.update(warningTransaction, {
      where: { id: warningTransaction.id },
      transaction: this.transaction,
    });

    return warningTransaction;
  }

  async getAllInAnalysis(): Promise<WarningTransaction[]> {
    return WarningTransactionModel.findAll<WarningTransactionModel>({
      where: {
        status: WarningTransactionStatus.SENT,
      },
      transaction: this.transaction,
    }).then((res) => res.map(WarningTransactionDatabaseRepository.toDomain));
  }
}
