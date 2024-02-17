import { Transaction } from '@zro/payments-gateway/domain';

export interface TransactionRepository {
  /**
   * Create pix statement.
   *
   * @param transaction New transaction.
   * @returns Created transaction.
   */
  create: (transaction: Transaction) => Promise<Transaction>;

  /**
   * Update pix statement.
   *
   * @param transaction New transaction.
   * @returns Created transaction.
   */
  update: (transaction: Transaction) => Promise<Transaction>;

  /**
   * Get by date formated YYYY-MM-DD.
   * @param date
   * @returns Transaction found or null otherwise.
   */
  getAllByDate: (date: Date) => Promise<Transaction[]>;

  /**
   * Get all.
   * @param page
   * @returns Transaction found or null otherwise.
   */
  getAll: () => Promise<Transaction[]>;
}
