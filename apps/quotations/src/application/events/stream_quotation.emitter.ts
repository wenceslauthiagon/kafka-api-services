import { StreamQuotation } from '@zro/quotations/domain';

export type StreamQuotationEvent = Pick<
  StreamQuotation,
  | 'baseCurrency'
  | 'quoteCurrency'
  | 'gatewayName'
  | 'buy'
  | 'sell'
  | 'streamPair'
>;

export interface StreamQuotationEventEmitter {
  /**
   * Emit created event.
   * @param event Data.
   */
  createStreamQuotation: (event: StreamQuotationEvent[]) => void;
}
