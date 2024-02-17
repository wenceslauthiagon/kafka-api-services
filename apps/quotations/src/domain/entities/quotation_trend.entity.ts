import { Domain } from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';

export enum QuotationTrendResolution {
  'QTR_1m' = '1m',
  'QTR_5m' = '5m',
  'QTR_10m' = '10m',
  'QTR_20m' = '20m',
  'QTR_30m' = '30m',
  'QTR_1h' = '1h',
  'QTR_2h' = '2h',
  'QTR_6h' = '6h',
  'QTR_12h' = '12h',
  'QTR_1d' = '1d',
  'QTR_3d' = '3d',
  'QTR_1w' = '1w',
}

export enum QuotationTrendWindow {
  'QTW_6h' = '6h',
  'QTW_12h' = '12h',
  'QTW_1d' = '1d',
  'QTW_3d' = '3d',
  'QTW_1w' = '1w',
  'QTW_2w' = '2w',
  'QTW_4w' = '4w',
  'QTW_12w' = '12w',
  'QTW_24w' = '24w',
  'QTW_1y' = '1y',
}

export const quotationTrendWindowMinResolution = {
  [QuotationTrendWindow['QTW_6h']]: QuotationTrendResolution['QTR_1m'],
  [QuotationTrendWindow['QTW_12h']]: QuotationTrendResolution['QTR_5m'],
  [QuotationTrendWindow['QTW_1d']]: QuotationTrendResolution['QTR_10m'],
  [QuotationTrendWindow['QTW_3d']]: QuotationTrendResolution['QTR_20m'],
  [QuotationTrendWindow['QTW_1w']]: QuotationTrendResolution['QTR_30m'],
  [QuotationTrendWindow['QTW_2w']]: QuotationTrendResolution['QTR_1h'],
  [QuotationTrendWindow['QTW_4w']]: QuotationTrendResolution['QTR_2h'],
  [QuotationTrendWindow['QTW_12w']]: QuotationTrendResolution['QTR_6h'],
  [QuotationTrendWindow['QTW_24w']]: QuotationTrendResolution['QTR_12h'],
  [QuotationTrendWindow['QTW_1y']]: QuotationTrendResolution['QTR_1d'],
};

export interface QuotationTrend extends Domain<string> {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  gatewayName: string;
  amount: number;
  price: number;
  side: OrderSide;
  timestamp: Date;
}

export class QuotationTrendEntity implements QuotationTrend {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  gatewayName: string;
  amount: number;
  price: number;
  side: OrderSide;
  timestamp: Date;

  constructor(props: Partial<QuotationTrend>) {
    Object.assign(this, props);
  }
}
