import { Domain } from '@zro/common';
import { Operation, Currency } from '@zro/operations/domain';
import { Provider, Remittance, OrderSide } from '@zro/otc/domain';
import { Quotation } from '@zro/quotations/domain';
import { User } from '@zro/users/domain';

export interface Conversion extends Domain<string> {
  operation: Operation;
  remittance?: Remittance;
  user?: User;
  provider?: Provider;
  currency?: Currency;
  quotation?: Quotation;
  conversionType: OrderSide;
  clientName?: string;
  clientDocument?: string;
  amount?: number;
  quote?: string;
  usdAmount: number;
  usdQuote?: number;
  fiatAmount?: number;
  tradeId?: string;
  createdAt?: Date;
}

export class ConversionEntity implements Conversion {
  id: string;
  operation: Operation;
  remittance?: Remittance;
  user?: User;
  provider?: Provider;
  quotation?: Quotation;
  currency?: Currency;
  conversionType: OrderSide;
  clientName?: string;
  clientDocument?: string;
  amount?: number;
  quote?: string;
  usdAmount: number;
  usdQuote?: number;
  fiatAmount?: number;
  tradeId?: string;
  createdAt?: Date;

  constructor(props: Partial<Conversion>) {
    Object.assign(this, props);
  }
}
