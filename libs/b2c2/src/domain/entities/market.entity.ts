export enum B2C2MarketType {
  SPOT = 'SPOT',
}

export interface B2C2Market {
  name: string;
  underlier: string;
  quoteCurrency: string;
  baseCurrency: string;
  type: B2C2MarketType;
  isTradable: boolean;
  quantityPrecision: number;
  maxQuantityPerTrade: number;
  minQuantityPerTrade: number;
  priceSignificantDigits: number;
}

export class B2C2MarketEntity implements B2C2Market {
  name: string;
  underlier: string;
  quoteCurrency: string;
  baseCurrency: string;
  type: B2C2MarketType;
  isTradable: boolean;
  quantityPrecision: number;
  maxQuantityPerTrade: number;
  minQuantityPerTrade: number;
  priceSignificantDigits: number;

  constructor(props: Partial<B2C2Market>) {
    Object.assign(this, props);
  }
}
