import { Remittance, System } from '@zro/otc/domain';

export type RemittanceEvent = Pick<Remittance, 'id'> & {
  systemId?: System['id'];
};

export interface RemittanceEventEmitter {
  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittance: (event: RemittanceEvent) => void;

  /**
   * Emit closed event.
   * @param event Data.
   */
  closedRemittance: (event: RemittanceEvent) => void;

  /**
   * Emit manually closed event.
   * @param event Data.
   */
  manuallyClosedRemittance: (event: RemittanceEvent) => void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingRemittance: (event: RemittanceEvent) => void;
}
