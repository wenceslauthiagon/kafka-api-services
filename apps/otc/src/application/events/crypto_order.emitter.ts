import { CryptoOrder } from '@zro/otc/domain';

export type CryptoOrderEvent = Pick<CryptoOrder, 'id' | 'state' | 'user'>;

export interface CryptoOrderEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingCryptoOrder: (event: CryptoOrderEvent) => void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedCryptoOrder: (event: CryptoOrderEvent) => void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedCryptoOrder: (event: CryptoOrderEvent) => void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorCryptoOrder: (event: CryptoOrderEvent) => void;
}
