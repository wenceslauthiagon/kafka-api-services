// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { DefaultModel } from '@zro/common';
import {
  BinanceFilterType,
  BinanceMarket,
  BinanceMarketEntity,
  BinanceMarketType,
  BinanceOrderType,
  BinanceSymbolStatus,
} from '@zro/binance/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';

const fakerModel = (
  baseCurrency: Currency,
  quoteCurrency: Currency,
): BinanceMarket => ({
  symbol: 'BTCBUSD',
  status: BinanceSymbolStatus.TRADING,
  baseAsset: 'BTC',
  baseAssetPrecision: 8,
  quoteAsset: 'BUSD',
  quotePrecision: 8,
  quoteAssetPrecision: 8,
  baseCommissionPrecision: 8,
  quoteCommissionPrecision: 8,
  orderTypes: [
    BinanceOrderType.LIMIT,
    BinanceOrderType.LIMIT_MAKER,
    BinanceOrderType.MARKET,
    BinanceOrderType.STOP_LOSS_LIMIT,
    BinanceOrderType.TAKE_PROFIT_LIMIT,
  ],
  icebergAllowed: true,
  ocoAllowed: true,
  quoteOrderQtyMarketAllowed: true,
  allowTrailingStop: true,
  cancelReplaceAllowed: true,
  isSpotTradingAllowed: true,
  isMarginTradingAllowed: true,
  filters: [
    {
      filterType: BinanceFilterType.PRICE_FILTER,
      minPrice: '0.01000000',
      maxPrice: '1000000.00000000',
      tickSize: '0.01000000',
    },
    {
      filterType: BinanceFilterType.PERCENT_PRICE,
      multiplierUp: '5',
      multiplierDown: '0.2',
      avgPriceMins: 5,
    },
    {
      filterType: BinanceFilterType.LOT_SIZE,
      minQty: '0.00001000',
      maxQty: '9000.00000000',
      stepSize: '0.00001000',
    },
    {
      filterType: BinanceFilterType.MIN_NOTIONAL,
      minNotional: '10.00000000',
      applyToMarket: true,
      avgPriceMins: 5,
    },
    { filterType: BinanceFilterType.ICEBERG_PARTS, limit: 10 },
    {
      filterType: BinanceFilterType.MARKET_LOT_SIZE,
      minQty: '0.00000000',
      maxQty: '145.61731344',
      stepSize: '0.00000000',
    },
    {
      filterType: BinanceFilterType.TRAILING_DELTA,
      minTrailingAboveDelta: 10,
      maxTrailingAboveDelta: 2000,
      minTrailingBelowDelta: 10,
      maxTrailingBelowDelta: 2000,
    },
    { filterType: BinanceFilterType.MAX_NUM_ORDERS, maxNumOrders: 200 },
    { filterType: BinanceFilterType.MAX_NUM_ALGO_ORDERS, maxNumAlgoOrders: 5 },
  ],
  permissions: [
    BinanceMarketType.SPOT,
    BinanceMarketType.MARGIN,
    BinanceMarketType.TRD_GRP_004,
    BinanceMarketType.TRD_GRP_005,
  ],
  baseCurrencySymbol: baseCurrency.symbol,
  quoteCurrencySymbol: quoteCurrency.symbol,
});

/**
 * Binance market entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BinanceMarketEntity.name);

factory.define<BinanceMarketEntity>(
  BinanceMarketEntity.name,
  DefaultModel,
  async (options) => {
    const baseCurrency =
      options.baseCurrency ??
      (await CurrencyFactory.create<Currency>(CurrencyEntity.name));
    const quoteCurrency =
      options.quoteCurrency ??
      (await CurrencyFactory.create<Currency>(CurrencyEntity.name));

    return fakerModel(baseCurrency, quoteCurrency);
  },
  {
    afterBuild: (model) => {
      return new BinanceMarketEntity(model);
    },
  },
);

export const BinanceMarketFactory = factory;
