import { Conversion } from '@zro/otc/domain';

export type ConversionEvent = Pick<Conversion, 'id' | 'user'>;

export interface ConversionEventEmitter {
  /**
   * Emit ready event.
   * @param event Data.
   */
  readyConversion: (event: ConversionEvent) => void;
}
