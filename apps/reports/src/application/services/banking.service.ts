import { BankingTed, BankingTedReceived } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export interface BankingService {
  /**
   * Get a BankingTedReceived by Operation.
   * @param operation Operation.
   * @returns BankingTedReceived found otherwise null.
   */
  getBankingTedReceivedByOperation(
    operation: Operation,
  ): Promise<BankingTedReceived>;

  /**
   * Get a BankingTed by Operation.
   * @param operation Operation.
   * @returns BankingTed found otherwise null.
   */
  getBankingTedByOperation(operation: Operation): Promise<BankingTed>;
}
