import { Cashback } from '@zro/otc/domain';

export type CashbackEvent = Pick<Cashback, 'id' | 'user'>;

export interface CashbackEventEmitter {
  /**
   * Emit ready event.
   * @param event Data.
   */
  readyCashback: (event: CashbackEvent) => void;
}
