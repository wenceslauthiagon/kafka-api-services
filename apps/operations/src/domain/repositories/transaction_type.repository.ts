import { TransactionType } from '@zro/operations/domain';

export interface TransactionTypeRepository {
  /**
   * Get transaction type by tag.
   *
   * @param {String} tag Type tag.
   * @returns Transaction found or null otherwise.
   */
  getByTag: (tag: string) => Promise<TransactionType>;

  /**
   * Get active transaction type by tag.
   *
   * @param {String} tag Type tag.
   * @returns Transaction found or null otherwise.
   */
  getActiveByTag: (tag: string) => Promise<TransactionType>;

  /**
   * Get transaction type by tag.
   *
   * @param {Number} id Transaction type id.
   * @returns Transaction Type found or null otherwise.
   */
  getById: (id: number) => Promise<TransactionType>;
}
