import { Domain, formatValueFromIntToFloat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { Spread, Provider, OrderSide } from '@zro/otc/domain';
import { StreamQuotation, StreamPair, Tax } from '@zro/quotations/domain';

/**
 * The bps decimal value (ex: 1% = 100 bps)
 */
const BPS_DECIMAL = 4;

export interface Quotation extends Domain<string> {
  provider: Provider;
  streamPair: StreamPair;
  side: OrderSide;

  price: number;
  priceBuy: number;
  priceSell: number;

  partialBuy: number;
  partialSell: number;

  iof: Tax;
  iofAmount: number;

  spreads: Spread[];
  spreadBuy: number;
  spreadSell: number;
  spreadBuyFloat: number;
  spreadSellFloat: number;

  spreadAmountBuy: number;
  spreadAmountSell: number;

  quoteCurrency: Currency;
  quoteAmountBuy: number;
  quoteAmountSell: number;

  baseCurrency: Currency;
  baseAmountBuy: number;
  baseAmountSell: number;

  streamQuotation: StreamQuotation;

  createdAt?: Date;
  updatedAt?: Date;
}

export class QuotationEntity implements Quotation {
  id: string;
  provider!: Provider;
  streamPair!: StreamPair;
  side!: OrderSide;

  price!: number;
  priceBuy!: number;
  priceSell!: number;

  partialBuy: number;
  partialSell: number;

  iof!: Tax;
  iofAmount: number;

  spreads!: Spread[];
  spreadBuy!: number;
  spreadSell!: number;
  spreadAmountBuy: number;
  spreadAmountSell: number;

  quoteCurrency!: Currency;
  quoteAmountBuy: number;
  quoteAmountSell: number;

  baseCurrency!: Currency;
  baseAmountBuy: number;
  baseAmountSell: number;

  streamQuotation!: StreamQuotation;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<Quotation>) {
    Object.assign(this, props);
  }

  get spreadBuyFloat(): number {
    return formatValueFromIntToFloat(this.spreadBuy, BPS_DECIMAL);
  }

  get spreadSellFloat(): number {
    return formatValueFromIntToFloat(this.spreadSell, BPS_DECIMAL);
  }
}
