import { PixDevolution } from '@zro/pix-payments/domain';

export type PixDevolutionEvent = Pick<
  PixDevolution,
  'id' | 'state' | 'user' | 'wallet' | 'endToEndId'
>;

export interface PixDevolutionEventEmitter {
  /**
   * Emit completed event.
   * @param event Data.
   */
  completedDevolution(event: PixDevolutionEvent): void;
}
