import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { StreamPair } from './stream_pair.entity';

export interface StreamQuotation extends Domain<string> {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  buy: number;
  sell: number;
  amount: number;
  gatewayName: string;
  composedBy?: StreamQuotation[];
  timestamp: Date;
  streamPair: StreamPair;

  isSynthetic(): boolean;
}

export class StreamQuotationEntity implements StreamQuotation {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  buy: number;
  sell: number;
  amount: number;
  gatewayName: string;
  composedBy?: StreamQuotation[];
  timestamp: Date;
  streamPair: StreamPair;

  constructor(props: Partial<StreamQuotation>) {
    Object.assign(this, props);
  }

  isSynthetic(): boolean {
    return !!this.composedBy?.length;
  }
}
