export enum MercadoBitcoinSymbolType {
  CRYPTO = 'CRYPTO',
  FAN_TOKEN = 'FAN_TOKEN',
  DIGITAL_ASSET = 'DIGITAL_ASSET',
  UTILITY_TOKEN = 'UTILITY_TOKEN',
  DEFI = 'DEFI',
}

export interface MercadoBitcoinSymbol {
  id: string;
  symbol: string;
  description: string;
  currency: string;
  baseCurrency: string;
  exchangeListed: boolean;
  exchangeTraded: boolean;
  minmovement: string;
  pricescale: number;
  type: MercadoBitcoinSymbolType;
  timezone: string;
  sessionRegular: string;
  withdrawalFee: string;
}

export class MercadoBitcoinSymbolEntity implements MercadoBitcoinSymbol {
  id: string;
  symbol: string;
  description: string;
  currency: string;
  baseCurrency: string;
  exchangeListed: boolean;
  exchangeTraded: boolean;
  minmovement: string;
  pricescale: number;
  type: MercadoBitcoinSymbolType;
  timezone: string;
  sessionRegular: string;
  withdrawalFee: string;

  constructor(props: Partial<MercadoBitcoinSymbol>) {
    Object.assign(this, props);
  }
}
