import { BankingTedFailure } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export interface BankingTedFailureRepository {
  /**
   * Insert a banking ted failure.
   * @param bankingTedFailure BankingTedFailure to save.
   * @returns Created bankingTedFailure.
   */
  create(bankingTedFailure: BankingTedFailure): Promise<BankingTedFailure>;

  /**
   * Update a banking ted failure.
   * @param bankingTedFailure BankingTedFailure to update.
   * @returns Updated bankingTedFailure.
   */
  update(bankingTedFailure: BankingTedFailure): Promise<BankingTedFailure>;

  /**
   * Get banking ted failure by id.
   * @param id The ted id.
   * @returns The ted found.
   */
  getById(id: number): Promise<BankingTedFailure>;

  /**
   * Get banking ted failure by operationId.
   * @param operation The Operation.
   * @returns The ted found.
   */
  getByOperation(operation: Operation): Promise<BankingTedFailure>;
}
