import {
  WarningPixDevolution,
  WarningPixDeposit,
} from '@zro/pix-payments/domain';

export type WarningPixDevolutionEvent = Pick<
  WarningPixDevolution,
  'id' | 'state' | 'user' | 'failed' | 'chargebackReason' | 'endToEndId'
> & { warningPixDeposit?: WarningPixDeposit };

export interface WarningPixDevolutionEventEmitter {
  /**
   * Emit completed event.
   * @param event Data.
   */
  pendingWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedWarningPixDevolution(event: WarningPixDevolutionEvent): void;

  /**
   * Emit create event.
   * @param event Data.
   */
  createWarningPixDevolution(event: WarningPixDevolutionEvent): void;
}
