import { RemittanceOrder } from '@zro/otc/domain';

export type RemittanceOrderEvent = Pick<RemittanceOrder, 'id'>;

export interface RemittanceOrderEventEmitter {
  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittanceOrder: (event: RemittanceOrderEvent) => void;

  /**
   * Emit closed event.
   * @param event Data.
   */
  closedRemittanceOrder: (event: RemittanceOrderEvent) => void;
}
