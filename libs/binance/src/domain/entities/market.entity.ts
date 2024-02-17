import { BinanceOrderType } from './order.entity';

export enum BinanceMarketType {
  SPOT = 'SPOT',
  MARGIN = 'MARGIN',
  LEVERAGED = 'LEVERAGED',
  TRD_GRP_004 = 'TRD_GRP_004',
  TRD_GRP_005 = 'TRD_GRP_005',
}

export enum BinanceSymbolStatus {
  PRE_TRADING = 'PRE_TRADING',
  TRADING = 'TRADING',
  POST_TRADING = 'POST_TRADING',
  END_OF_DAY = 'END_OF_DAY',
  HALT = 'HALT',
  AUCTION_MATCH = 'AUCTION_MATCH',
  BREAK = 'BREAK',
}

export enum BinanceFilterType {
  PRICE_FILTER = 'PRICE_FILTER',
  PERCENT_PRICE = 'PERCENT_PRICE',
  PERCENT_PRICE_BY_SIDE = 'PERCENT_PRICE_BY_SIDE',
  LOT_SIZE = 'LOT_SIZE',
  MIN_NOTIONAL = 'MIN_NOTIONAL',
  NOTIONAL = 'NOTIONAL',
  ICEBERG_PARTS = 'ICEBERG_PARTS',
  MARKET_LOT_SIZE = 'MARKET_LOT_SIZE',
  MAX_NUM_ORDERS = 'MAX_NUM_ORDERS',
  MAX_NUM_ALGO_ORDERS = 'MAX_NUM_ALGO_ORDERS',
  MAX_NUM_ICEBERG_ORDERS = 'MAX_NUM_ICEBERG_ORDERS',
  MAX_POSITION = 'MAX_POSITION',
  TRAILING_DELTA = 'TRAILING_DELTA',
  EXCHANGE_MAX_NUM_ORDERS = 'EXCHANGE_MAX_NUM_ORDERS',
  EXCHANGE_MAX_NUM_ALGO_ORDERS = 'EXCHANGE_MAX_NUM_ALGO_ORDERS',
}

export enum BinanceRateLimitType {
  REQUEST_WEIGHT = 'REQUEST_WEIGHT',
  ORDERS = 'ORDERS',
  RAW_REQUESTS = 'RAW_REQUESTS',
}

export enum BinanceRateLimitInterval {
  SECOND = 'SECOND',
  MINUTE = 'MINUTE',
  DAY = 'DAY',
}

type PriceFilter = {
  filterType: BinanceFilterType.PRICE_FILTER;
  minPrice: string;
  maxPrice: string;
  tickSize: string;
};

type PercentPrice = {
  filterType: BinanceFilterType.PERCENT_PRICE;
  multiplierUp: string;
  multiplierDown: string;
  avgPriceMins: number;
};

type PercentPriceBySide = {
  filterType: BinanceFilterType.PERCENT_PRICE_BY_SIDE;
  bidMultiplierUp: string;
  bidMultiplierDown: string;
  askMultiplierUp: string;
  askMultiplierDown: string;
  avgPriceMins: number;
};

type LotSize = {
  filterType: BinanceFilterType.LOT_SIZE;
  minQty: string;
  maxQty: string;
  stepSize: string;
};

type MinNotional = {
  filterType: BinanceFilterType.MIN_NOTIONAL;
  minNotional: string;
  applyToMarket: boolean;
  avgPriceMins: number;
};

type Notional = {
  filterType: BinanceFilterType.NOTIONAL;
  minNotional: string;
  applyMinToMarket: boolean;
  maxNotional: string;
  applyMaxToMarket: boolean;
  avgPriceMins: number;
};

type IcebergParts = {
  filterType: BinanceFilterType.ICEBERG_PARTS;
  limit: number;
};

type MarketLotSize = {
  filterType: BinanceFilterType.MARKET_LOT_SIZE;
  minQty: string;
  maxQty: string;
  stepSize: string;
};

type MaxNumOrders = {
  filterType: BinanceFilterType.MAX_NUM_ORDERS;
  maxNumOrders: number;
};

type MaxNumAlgoOrders = {
  filterType: BinanceFilterType.MAX_NUM_ALGO_ORDERS;
  maxNumAlgoOrders: number;
};

type MaxNumIcebergOrders = {
  filterType: BinanceFilterType.MAX_NUM_ICEBERG_ORDERS;
  maxNumIcebergOrders: number;
};

type MaxPosition = {
  filterType: BinanceFilterType.MAX_POSITION;
  maxPosition: string;
};

type TrailingDelta = {
  filterType: BinanceFilterType.TRAILING_DELTA;
  minTrailingAboveDelta: number;
  maxTrailingAboveDelta: number;
  minTrailingBelowDelta: number;
  maxTrailingBelowDelta: number;
};

type ExchangeMaxNumOrders = {
  filterType: BinanceFilterType.TRAILING_DELTA;
  maxNumOrders: number;
};

type ExchangeMaxNumAlgoOrders = {
  filterType: BinanceFilterType.TRAILING_DELTA;
  maxNumAlgoOrders: number;
};

export type BinanceSymbolFilter =
  | PriceFilter
  | PercentPrice
  | PercentPriceBySide
  | LotSize
  | MinNotional
  | Notional
  | IcebergParts
  | MarketLotSize
  | MaxNumOrders
  | MaxNumAlgoOrders
  | MaxNumIcebergOrders
  | MaxPosition
  | TrailingDelta;

export type BinanceExchangeFilter =
  | ExchangeMaxNumOrders
  | ExchangeMaxNumAlgoOrders;

export type BinanceRateLimit = {
  rateLimitType: BinanceRateLimitType;
  interval: BinanceRateLimitInterval;
  intervalNum: number;
  limit: number;
};
export interface BinanceMarket {
  symbol: string;
  status: BinanceSymbolStatus;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: BinanceOrderType[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  allowTrailingStop: boolean;
  cancelReplaceAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: BinanceSymbolFilter[];
  permissions: BinanceMarketType[];
  baseCurrencySymbol?: string;
  quoteCurrencySymbol?: string;
  fee?: number;
}

export class BinanceMarketEntity implements BinanceMarket {
  symbol: string;
  status: BinanceSymbolStatus;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: BinanceOrderType[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  allowTrailingStop: boolean;
  cancelReplaceAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: BinanceSymbolFilter[];
  permissions: BinanceMarketType[];
  baseCurrencySymbol?: string;
  quoteCurrencySymbol?: string;
  fee?: number;

  constructor(props: Partial<BinanceMarket>) {
    Object.assign(this, props);
  }
}
