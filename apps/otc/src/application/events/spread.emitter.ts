import { Spread } from '@zro/otc/domain';

export interface SpreadEvent {
  id?: string;
  currencySymbol: string;
  buy?: number;
  sell?: number;
  amount?: number;
}

export interface SpreadEventEmitter {
  /**
   * Call quotations microservice to emit new spreads.
   * @param spreads Data.
   */
  createdSpreads: (spreads: Spread[]) => void;

  /**
   * Call quotations microservice to emit deleted spread.
   * @param spreads Data.
   */
  deletedSpread: (spread: Spread) => void;
}
