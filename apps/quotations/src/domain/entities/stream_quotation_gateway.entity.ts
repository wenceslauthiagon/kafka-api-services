import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';

export interface StreamQuotationGateway extends Domain<string> {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  buy: number;
  sell: number;
  amount: number;
  gatewayName: string;
  timestamp: Date;
}

export class StreamQuotationGatewayEntity implements StreamQuotationGateway {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  buy: number;
  sell: number;
  amount: number;
  gatewayName: string;
  timestamp: Date;

  constructor(props: Partial<StreamQuotationGateway>) {
    Object.assign(this, props);
  }
}
