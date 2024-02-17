import { Domain } from '@zro/common';
import { ExchangeQuotation, Remittance } from '@zro/otc/domain';

export interface RemittanceExchangeQuotation extends Domain<string> {
  remittance: Remittance;
  exchangeQuotation: ExchangeQuotation;
  createdAt: Date;
}

export class RemittanceExchangeQuotationEntity
  implements RemittanceExchangeQuotation
{
  id: string;
  remittance: Remittance;
  exchangeQuotation: ExchangeQuotation;
  createdAt: Date;

  constructor(props: Partial<RemittanceExchangeQuotation>) {
    Object.assign(this, props);
  }
}
