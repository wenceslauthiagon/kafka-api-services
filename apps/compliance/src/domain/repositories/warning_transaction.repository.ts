import { WarningTransaction } from '@zro/compliance/domain';
import { Operation } from '@zro/operations/domain';

export interface WarningTransactionRepository {
  /**
   * Insert a warning transaction.
   * @param {WarningTransaction} warningTransaction Warning transaction to save.
   * @returns {WarningTransaction} Created warning transaction.
   */
  create: (
    warningTransaction: WarningTransaction,
  ) => Promise<WarningTransaction>;

  /**
   * Search by warning transaction ID.
   * @param {UUID} id Warning transaction ID.
   * @return {WarningTransaction} Warning transaction found.
   */
  getById: (id: string) => Promise<WarningTransaction>;

  /**
   * Search by warning transaction operation ID.
   * @param {Operation} operation Operation.
   * @return {WarningTransaction} Warning transaction found.
   */
  getByOperation: (operation: Operation) => Promise<WarningTransaction>;

  /**
   * Update a warning transaction.
   * @param {WarningTransaction} warningTransaction Warning transaction to update.
   * @returns {WarningTransaction} Updated warning transaction.
   */
  update: (
    warningTransaction: WarningTransaction,
  ) => Promise<WarningTransaction>;

  /**
   * Search warning transactions that are in analysis.
   * @return Warning transactions found.
   */
  getAllInAnalysis: () => Promise<WarningTransaction[]>;
}
