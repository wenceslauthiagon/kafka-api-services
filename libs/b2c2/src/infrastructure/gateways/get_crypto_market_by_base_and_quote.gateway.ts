import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { formatValueFromFloatToInt } from '@zro/common';
import { B2C2Market } from '@zro/b2c2/domain';
import {
  GetCryptoMarketByBaseAndQuoteGateway,
  GetCryptoMarketByBaseAndQuoteRequest,
  GetCryptoMarketByBaseAndQuoteResponse,
} from '@zro/otc/application';
import { B2C2_PROVIDER_NAME, B2C2_CACHE } from '@zro/b2c2/infrastructure';

export class B2C2GetCryptoMarketsGateway
  implements GetCryptoMarketByBaseAndQuoteGateway
{
  constructor(
    private logger: Logger,
    private cache: Cache,
  ) {
    this.logger = logger.child({
      context: B2C2GetCryptoMarketsGateway.name,
    });
  }

  async getCryptoMarketByBaseAndQuote(
    request: GetCryptoMarketByBaseAndQuoteRequest,
  ): Promise<GetCryptoMarketByBaseAndQuoteResponse> {
    const b2c2Markets = await this.getB2C2Markets();

    const { baseCurrency, quoteCurrency } = request;

    const market = b2c2Markets.find(
      (b2c2Market) =>
        baseCurrency.symbol === b2c2Market.baseCurrency &&
        quoteCurrency.symbol === b2c2Market.quoteCurrency,
    );

    if (!market) return null;

    const minSize =
      market.minQuantityPerTrade &&
      formatValueFromFloatToInt(
        market.minQuantityPerTrade,
        baseCurrency.decimal,
      );
    const maxSize =
      market.maxQuantityPerTrade &&
      formatValueFromFloatToInt(
        market.maxQuantityPerTrade,
        baseCurrency.decimal,
      );
    const sizeIncrement =
      market.quantityPrecision &&
      formatValueFromFloatToInt(market.quantityPrecision, baseCurrency.decimal);

    const priceSignificantDigits = market.priceSignificantDigits;
    const priceIncrement = market.priceSignificantDigits && 1;

    return {
      name: market.name,
      baseCurrency,
      quoteCurrency,
      providerName: B2C2_PROVIDER_NAME,
      active: market.isTradable,
      requireValidUntil: true,
      requireStopPrice: false,
      minSize,
      maxSize,
      sizeIncrement,
      priceIncrement,
      priceSignificantDigits,
    };
  }

  async getB2C2Markets(): Promise<B2C2Market[]> {
    const markets = await this.cache.get<B2C2Market[]>(B2C2_CACHE.MARKETS);
    return markets ?? [];
  }
}
