import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  CryptoMarket,
  CryptoOrder,
  CryptoRemittanceStatus,
  OrderType,
  Provider,
  Remittance,
} from '@zro/otc/domain';
import { BotOtc } from '@zro/otc-bot/domain';

export enum BotOtcOrderState {
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  FILLED = 'FILLED',
}

export interface BotOtcOrder extends Domain<string> {
  botOtc: BotOtc;
  state: BotOtcOrderState;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  market: CryptoMarket;
  amount: number; // Integer - Fixed point of baseCurrency.decimal
  type: OrderType;
  sellStatus: CryptoRemittanceStatus;
  sellPrice: number; // Integer - Fixed point of market.priceSignificantDigits
  sellStopPrice?: number; // Integer - Fixed point of maket.priceSignificantDigits
  sellValidUntil?: Date;
  sellProvider: Provider;
  sellProviderOrderId: string;
  sellProviderName: string;
  sellExecutedPrice?: number;
  sellExecutedAmount?: number;
  sellFee?: number;
  buyProvider?: Provider;
  buyProviderOrderId?: string;
  buyProviderName?: string;
  buyExecutedPrice?: number;
  buyExecutedAmount?: number;
  buyPriceSignificantDigits?: number;
  buyFee?: number;
  sellOrder?: CryptoOrder;
  buyOrder?: CryptoOrder;
  failedCode?: string;
  failedMessage?: string;
  buyRemittance?: Remittance;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BotOtcOrderEntity implements BotOtcOrder {
  id?: string;
  botOtc: BotOtc;
  state: BotOtcOrderState;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  market: CryptoMarket;
  amount: number; // Integer - Fixed point of baseCurrency.decimal
  type: OrderType;
  sellStatus: CryptoRemittanceStatus;
  sellPrice: number; // Integer - Fixed point of market.priceSignificantDigits
  sellStopPrice?: number; // Integer - Fixed point of maket.priceSignificantDigits
  sellValidUntil?: Date;
  sellProvider: Provider;
  sellProviderOrderId: string;
  sellProviderName: string;
  sellExecutedPrice?: number;
  sellExecutedAmount?: number;
  sellFee?: number;
  buyProvider?: Provider;
  buyProviderOrderId?: string;
  buyProviderName?: string;
  buyExecutedPrice?: number;
  buyExecutedAmount?: number;
  buyPriceSignificantDigits?: number;
  buyFee?: number;
  sellOrder?: CryptoOrder;
  buyOrder?: CryptoOrder;
  failedCode?: string;
  failedMessage?: string;
  buyRemittance?: Remittance;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<BotOtcOrder>) {
    Object.assign(this, props);
  }
}
