import { Wallet } from '@zro/operations/domain';
import { Payment } from '@zro/pix-payments/domain';

export interface PixPaymentService {
  /**
   * Create pix payment by pix key.
   * @param wallet Wallet.
   * @param payment Payment.
   * @returns Pix payment created.
   */
  createByPixKey(wallet: Wallet, payment: Payment): Promise<Payment>;
}
