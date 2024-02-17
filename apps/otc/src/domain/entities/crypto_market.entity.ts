import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';

export interface CryptoMarket extends Domain<string> {
  name: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  providerName: string;
  active: boolean;
  requireValidUntil: boolean;
  requireStopPrice: boolean;
  minSize?: number;
  maxSize?: number;
  sizeIncrement?: number;
  priceIncrement?: number;
  priceSignificantDigits?: number;
  minNotional?: number;
  maxNotional?: number;
  fee?: number;
}

export class CryptoMarketEntity implements CryptoMarket {
  id?: string;
  name: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  providerName: string;
  active: boolean;
  requireValidUntil: boolean;
  requireStopPrice: boolean;
  minSize?: number;
  maxSize?: number;
  sizeIncrement?: number;
  priceIncrement?: number;
  priceSignificantDigits?: number;
  minNotional?: number;
  maxNotional?: number;
  fee?: number;

  constructor(props: Partial<CryptoMarket>) {
    Object.assign(this, props);
  }
}
