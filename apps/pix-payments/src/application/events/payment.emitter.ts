import { Payment } from '@zro/pix-payments/domain';

export type PaymentEvent = Pick<
  Payment,
  | 'id'
  | 'user'
  | 'wallet'
  | 'operation'
  | 'state'
  | 'endToEndId'
  | 'failed'
  | 'chargebackReason'
  | 'value'
  | 'transactionTag'
  | 'beneficiaryName'
  | 'beneficiaryDocument'
  | 'beneficiaryBankIspb'
  | 'beneficiaryBranch'
  | 'beneficiaryAccountNumber'
  | 'ownerFullName'
  | 'ownerDocument'
  | 'ownerBranch'
  | 'ownerAccountNumber'
>;

export interface PaymentEventEmitter {
  /**
   * Emit schedule event.
   * @param event Data.
   */
  scheduledPayment(event: PaymentEvent): void;

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingPayment(event: PaymentEvent): void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedPayment(event: PaymentEvent): void;

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledPayment(event: PaymentEvent): void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorPayment(event: PaymentEvent): void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingPayment(event: PaymentEvent): void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedPayment(event: PaymentEvent): void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedPayment(event: PaymentEvent): void;

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedPayment(event: PaymentEvent): void;
}
