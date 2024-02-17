import { Operation } from '@zro/operations/domain';
import { WarningTransaction } from '@zro/compliance/domain';
import { GetWarningTransactionByOperationResponse } from '@zro/compliance/interface';

export interface ComplianceService {
  /**
   * Create Warning Transaction.
   * @param payload the warning transaction.
   * @returns created warning transaction.
   */
  createWarningTransaction(payload: WarningTransaction): Promise<void>;

  /**
   * Get Warning Transaction by operation.
   * @param operation the warning transaction operation.
   * @returns warning transaction.
   */
  getWarningTransactionByOperation(
    operation: Operation,
  ): Promise<GetWarningTransactionByOperationResponse>;
}
