import { PixRefundDevolution, PixRefund } from '@zro/pix-payments/domain';

export type PixRefundDevolutionEvent = Pick<
  PixRefundDevolution,
  'id' | 'state' | 'user' | 'failed' | 'chargebackReason' | 'endToEndId'
> & { pixRefund?: PixRefund };

export interface PixRefundDevolutionEventEmitter {
  /**
   * Emit completed event.
   * @param event Data.
   */
  pendingRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedRefundDevolution(event: PixRefundDevolutionEvent): void;

  /**
   * Emit create event.
   * @param event Data.
   */
  createRefundDevolution(event: PixRefundDevolutionEvent): void;
}
