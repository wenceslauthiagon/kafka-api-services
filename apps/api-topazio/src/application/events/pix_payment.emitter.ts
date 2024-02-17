import { Payment } from '@zro/pix-payments/domain';

export type PixPaymentEvent = Pick<
  Payment,
  'id' | 'state' | 'user' | 'wallet' | 'endToEndId'
>;

export interface PixPaymentEventEmitter {
  /**
   * Emit completed event.
   * @param event Data.
   */
  completedPayment(event: PixPaymentEvent): void;
}
