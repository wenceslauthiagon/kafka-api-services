import { CryptoRemittance, System } from '@zro/otc/domain';

type SystemName = System['name'];

export type CryptoRemittanceEvent = CryptoRemittance & {
  systemName?: SystemName;
};

export interface CryptoRemittanceEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingCryptoRemittance: (event: CryptoRemittanceEvent) => void;

  /**
   * Emit filled event.
   * @param event Data.
   */
  filledCryptoRemittance: (event: CryptoRemittanceEvent) => void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingCryptoRemittance: (event: CryptoRemittanceEvent) => void;

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledCryptoRemittance: (event: CryptoRemittanceEvent) => void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorCryptoRemittance: (event: CryptoRemittanceEvent) => void;
}
