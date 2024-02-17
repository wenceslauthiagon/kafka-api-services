import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { MercadoBitcoinSymbol } from '@zro/mercado-bitcoin/domain';
import {
  GetCryptoMarketByBaseAndQuoteGateway,
  GetCryptoMarketByBaseAndQuoteRequest,
  GetCryptoMarketByBaseAndQuoteResponse,
} from '@zro/otc/application';
import {
  MERCADO_BITCOIN_PROVIDER_NAME,
  MERCADO_BITCOIN_CACHE,
} from '@zro/mercado-bitcoin/infrastructure';
import { formatValueFromFloatToInt } from '@zro/common';

export class MercadoBitcoinGetCryptoMarketsGateway
  implements GetCryptoMarketByBaseAndQuoteGateway
{
  constructor(
    private logger: Logger,
    private cache: Cache,
  ) {
    this.logger = logger.child({
      context: MercadoBitcoinGetCryptoMarketsGateway.name,
    });
  }

  async getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse> {
    const mbMarkets = await this.getMercadoBitcoinMarkets();

    const { baseCurrency, quoteCurrency } = request;

    const market = mbMarkets.find(
      (mbMarket) =>
        baseCurrency.symbol === mbMarket.baseCurrency &&
        quoteCurrency.symbol === mbMarket.currency,
    );

    if (!market) return null;

    const minSize =
      market.minmovement &&
      formatValueFromFloatToInt(market.minmovement, baseCurrency.decimal);
    const priceSignificantDigits =
      market.pricescale &&
      Math.ceil(Math.log(market.pricescale) / Math.log(10));
    const priceIncrement = market.pricescale && 1;

    return {
      name: market.id,
      baseCurrency,
      quoteCurrency,
      providerName: MERCADO_BITCOIN_PROVIDER_NAME,
      active: market.exchangeTraded,
      requireValidUntil: false,
      requireStopPrice: true,
      minSize,
      priceIncrement,
      priceSignificantDigits,
    };
  }

  async getMercadoBitcoinMarkets(): Promise<MercadoBitcoinSymbol[]> {
    return (
      (await this.cache.get<MercadoBitcoinSymbol[]>(
        MERCADO_BITCOIN_CACHE.MARKETS,
      )) ?? []
    );
  }
}
