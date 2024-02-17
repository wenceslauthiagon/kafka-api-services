import { Operation, Receipt } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface BankingService {
  /**
   * Get receipt of bankign ted by user.
   * @param user The user.
   * @param operation The operation.
   * @returns Receipt of banking ted.
   */
  getBankingTedReceipt(user: User, operation: Operation): Promise<Receipt>;
}
