import { PixDeposit } from '@zro/pix-payments/domain';

export type PixDepositEvent = Pick<
  PixDeposit,
  | 'id'
  | 'user'
  | 'wallet'
  | 'state'
  | 'amount'
  | 'operation'
  | 'transactionTag'
  | 'thirdPartName'
  | 'thirdPartDocument'
  | 'thirdPartBranch'
  | 'thirdPartAccountNumber'
  | 'thirdPartBank'
  | 'clientName'
  | 'clientDocument'
  | 'clientBranch'
  | 'clientAccountNumber'
> & {
  refundOperationId?: string;
};

export interface PixDepositEventEmitter {
  /**
   * Emit new event.
   * @param event Data.
   */
  newDeposit(event: PixDepositEvent): void;
  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingDeposit(event: PixDepositEvent): void;

  /**
   * Emit received event.
   * @param event Data.
   */
  receivedDeposit(event: PixDepositEvent): void;

  /**
   * Emit blocked event.
   * @param event Data.
   */
  blockedDeposit(event: PixDepositEvent): void;

  /**
   * Emit received failed event.
   * @param event Data.
   */
  receivedFailedDeposit(event: PixDepositEvent): void;
}
