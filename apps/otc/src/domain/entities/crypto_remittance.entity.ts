import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { CryptoMarket } from './crypto_market.entity';
import { OrderType, OrderSide } from './order.entity';
import { Provider } from './provider.entity';

export enum CryptoRemittanceStatus {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  FILLED = 'FILLED',
}

export interface CryptoRemittance extends Domain<string> {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  market: CryptoMarket;
  amount: number; // Integer - Fixed point of baseCurrency.decimal
  type: OrderType;
  side: OrderSide;
  price?: number; // Integer - Fixed point of market.priceSignificantDigits
  stopPrice?: number; // Integer - Fixed point of maket.priceSignificantDigits
  validUntil?: Date;
  provider?: Provider;
  providerOrderId?: string;
  providerName?: string;
  status: CryptoRemittanceStatus;
  executedPrice?: number;
  executedAmount?: number;
  fee?: number;
}

export class CryptoRemittanceEntity implements CryptoRemittance {
  id?: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  market: CryptoMarket;
  amount: number;
  type: OrderType;
  side: OrderSide;
  price?: number;
  stopPrice?: number;
  validUntil?: Date;
  provider?: Provider;
  providerOrderId?: string;
  providerName?: string;
  status: CryptoRemittanceStatus;
  executedPrice?: number;
  executedAmount?: number;
  fee?: number;

  constructor(props: Partial<CryptoRemittance>) {
    Object.assign(this, props);
  }
}
