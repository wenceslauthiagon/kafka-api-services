import { PixDevolutionReceived } from '@zro/pix-payments/domain';

export type PixDevolutionReceivedEvent = Pick<
  PixDevolutionReceived,
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

export interface PixDevolutionReceivedEventEmitter {
  /**
   * Emit ready devolution received event.
   * @param event Data.
   */
  readyDevolutionReceived(event: PixDevolutionReceivedEvent): void;

  /**
   * Emit error devolution received event.
   * @param event Data.
   */
  errorDevolutionReceived(event: PixDevolutionReceivedEvent): void;
}
