import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';

export interface OperationStreamQuotation extends Domain<string> {
  quoteCurrency: Currency;
  baseCurrency: Currency;
  provider: string;
  priority: number;
  price: number;
  priceBuy: number;
  priceSell: number;
}

export class OperationStreamQuotationEntity
  implements OperationStreamQuotation
{
  quoteCurrency: Currency;
  baseCurrency: Currency;
  provider: string;
  priority: number;
  price: number;
  priceBuy: number;
  priceSell: number;
  constructor(props: Partial<OperationStreamQuotation>) {
    Object.assign(this, props);
  }
}
