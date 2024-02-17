import { DatabaseRepository } from '@zro/common';
import {
  TransactionType,
  TransactionTypeRepository,
  TransactionTypeState,
} from '@zro/operations/domain';
import { TransactionTypeModel } from '@zro/operations/infrastructure';

export class TransactionTypeDatabaseRepository
  extends DatabaseRepository
  implements TransactionTypeRepository
{
  /**
   * Convert TransactionType model to TransactionType domain.
   * @param operation Model instance.
   * @returns {Domain instance.
   */
  static toDomain(operation: TransactionTypeModel): TransactionType {
    return operation?.toDomain() ?? null;
  }

  /**
   * Get transaction type by tag.
   *
   * @param tag Type tag.
   * @returns Transaction found or null otherwise.
   */
  async getByTag(tag: string) {
    return TransactionTypeModel.findOne({
      where: { tag },
      transaction: this.transaction,
    }).then(TransactionTypeDatabaseRepository.toDomain);
  }

  /**
   * Get actvie transaction type by tag.
   *
   * @param tag Type tag.
   * @returns Transaction found or null otherwise.
   */
  async getActiveByTag(tag: string) {
    return TransactionTypeModel.findOne({
      where: { tag, state: TransactionTypeState.ACTIVE },
      transaction: this.transaction,
    }).then(TransactionTypeDatabaseRepository.toDomain);
  }

  /**
   * Get transaction type by tag.
   *
   * @param id Type tag.
   * @returns Transaction found or null otherwise.
   */
  async getById(id: number) {
    return TransactionTypeModel.findOne({
      where: { id },
      transaction: this.transaction,
    }).then(TransactionTypeDatabaseRepository.toDomain);
  }
}
