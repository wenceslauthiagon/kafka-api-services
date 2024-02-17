import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { formatValueFromFloatToInt } from '@zro/common';
import {
  GetCryptoMarketByBaseAndQuoteGateway,
  GetCryptoMarketByBaseAndQuoteRequest,
  GetCryptoMarketByBaseAndQuoteResponse,
} from '@zro/otc/application';
import {
  BINANCE_PROVIDER_NAME,
  BINANCE_CACHE,
} from '@zro/binance/infrastructure';
import {
  BinanceFilterType,
  BinanceMarket,
  BinanceSymbolStatus,
} from '@zro/binance/domain';

export class BinanceGetCryptoMarketsGateway
  implements GetCryptoMarketByBaseAndQuoteGateway
{
  constructor(
    private cache: Cache,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: BinanceGetCryptoMarketsGateway.name,
    });
  }

  async getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse> {
    const binanceMarkets = await this.getBinanceMarkets();

    const { baseCurrency, quoteCurrency } = request;

    const market = binanceMarkets.find(
      (binanceMarket) =>
        baseCurrency.symbol === binanceMarket.baseCurrencySymbol &&
        quoteCurrency.symbol === binanceMarket.quoteCurrencySymbol,
    );

    if (!market) return null;

    let minQty = 0;
    let maxQty = 0;
    let stepSize = 0;
    let tickSize = 0;
    let minNotional;
    let maxNotional;

    for (const filter of market.filters) {
      if (filter.filterType === BinanceFilterType.LOT_SIZE) {
        minQty = parseFloat(filter.minQty);
        maxQty = parseFloat(filter.maxQty);
        stepSize = parseFloat(filter.stepSize);
      }

      if (filter.filterType === BinanceFilterType.PRICE_FILTER) {
        tickSize = parseFloat(filter.tickSize);
      }

      if (filter.filterType === BinanceFilterType.NOTIONAL) {
        minNotional = filter.applyMinToMarket && parseFloat(filter.minNotional);
        maxNotional = filter.applyMaxToMarket && parseFloat(filter.maxNotional);
      }
    }

    const minSize =
      minQty && formatValueFromFloatToInt(minQty, baseCurrency.decimal);
    const maxSize =
      maxQty && formatValueFromFloatToInt(maxQty, baseCurrency.decimal);
    const sizeIncrement =
      stepSize && formatValueFromFloatToInt(stepSize, baseCurrency.decimal);
    const priceSignificantDigits = market.quoteAssetPrecision;
    const priceIncrement = tickSize
      ? formatValueFromFloatToInt(tickSize, priceSignificantDigits)
      : 1;

    return {
      name: market.symbol,
      baseCurrency,
      quoteCurrency,
      providerName: BINANCE_PROVIDER_NAME,
      active: market.status === BinanceSymbolStatus.TRADING,
      requireValidUntil: false,
      requireStopPrice: false,
      minSize,
      maxSize,
      sizeIncrement,
      priceIncrement,
      priceSignificantDigits,
      ...(minNotional && {
        minNotional: formatValueFromFloatToInt(
          minNotional,
          priceSignificantDigits,
        ),
      }),
      ...(maxNotional && {
        maxNotional: formatValueFromFloatToInt(
          maxNotional,
          priceSignificantDigits,
        ),
      }),
      fee: market.fee,
    };
  }

  /*
   * Returns an array with all symbols trading rules
   */
  async getBinanceMarkets(): Promise<BinanceMarket[]> {
    const markets = await this.cache.get<BinanceMarket[]>(
      BINANCE_CACHE.MARKETS,
    );
    return markets ?? [];
  }
}
