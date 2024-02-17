import { PixDevolution } from '@zro/pix-payments/domain';

export type PixDevolutionEvent = Pick<
  PixDevolution,
  | 'id'
  | 'user'
  | 'wallet'
  | 'state'
  | 'endToEndId'
  | 'failed'
  | 'chargebackReason'
  | 'amount'
  | 'operation'
  | 'deposit'
> & { transactionTag?: string };

export interface PixDevolutionEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit create failed pix devolution event.
   * @param event Data.
   */
  createFailedPixDevolution(event: PixDevolutionEvent): void;

  /**
   * Emit pending failed pix devolution event.
   * @param event Data.
   */
  pendingFailedPixDevolution(event: PixDevolutionEvent): void;
}
