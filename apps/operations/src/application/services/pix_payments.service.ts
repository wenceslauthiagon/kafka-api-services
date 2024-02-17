import { Operation, Receipt, Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface PixPaymentsService {
  /**
   * Get receipt of payment by user and wallet.
   * @param user The user.
   * @param wallet The wallet.
   * @param operation The operation.
   * @returns Receipt of payment.
   */
  getPaymentReceipt(
    user: User,
    wallet: Wallet,
    operation: Operation,
  ): Promise<Receipt>;
}
