import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { AxiosInstance } from 'axios';
import { B2C2_SERVICES, B2C2_CACHE, b2c2Currency } from './services.constants';
import { B2C2Market, B2C2MarketType } from '@zro/b2c2/domain';

type B2C2InstrumentResponse = {
  name: string;
  underlier: string;
  type: B2C2MarketType;
  is_tradable: boolean;
  quantity_precision: number;
  max_quantity_per_trade: number;
  min_quantity_per_trade: number;
  price_significant_digits: number;
};

enum B2C2CurrencyType {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
  SYNTHETIC = 'synthetic',
}

type B2C2Currency = {
  stable_coin: boolean;
  is_crypto: boolean;
  currency_type: B2C2CurrencyType;
  readable_name: string;
  long_only: boolean;
  minimum_trade_size: number;
};

type B2C2CurrenciesResponse = Record<string, B2C2Currency>;

export class B2C2UpdateMarketsGateway {
  private readonly cache: Cache;
  private readonly logger: Logger;
  private readonly ttl: number;

  private axiosInstance: AxiosInstance;
  private updateMarketInterval: NodeJS.Timeout;
  private updateMarketTimeout: NodeJS.Timeout;
  private isUpdatingMarket = false;

  constructor({
    cache,
    logger,
    axiosInstance,
    ttl = 3600000,
  }: {
    cache: Cache;
    logger: Logger;
    axiosInstance: AxiosInstance;
    ttl?: number;
  }) {
    this.logger = logger.child({ context: B2C2UpdateMarketsGateway.name });

    this.cache = cache;
    this.axiosInstance = axiosInstance;
    this.ttl = ttl;
  }

  start(): void {
    this.stop();

    // Schedule update market every one hour.
    this.updateMarketInterval = setInterval(async () => {
      await this.updateMarkets();
    }, this.ttl);

    // Update market ASAP.
    this.updateMarketTimeout = setTimeout(async () => {
      this.updateMarketTimeout = null;
      await this.updateMarkets();
    }, 0);

    this.logger.info('Service started.');
  }

  stop() {
    this.updateMarketInterval && clearInterval(this.updateMarketInterval);
    this.updateMarketTimeout && clearTimeout(this.updateMarketTimeout);
    this.logger.debug('Stopped');
  }

  /**
   * Update markets every hour.
   */
  private async updateMarkets(): Promise<void> {
    // Avoid reentrance.
    if (this.isUpdatingMarket) return;
    this.isUpdatingMarket = true;

    try {
      // Get all supported markets from B2C2.
      const resultInstruments = await this.axiosInstance.get<
        B2C2InstrumentResponse[]
      >(B2C2_SERVICES.INSTRUMENTS);

      // Get all supported currencies by B2C2
      const resultCurrencies =
        await this.axiosInstance.get<B2C2CurrenciesResponse>(
          B2C2_SERVICES.CURRENCIES,
        );

      const currencies =
        (resultCurrencies.data && Object.keys(resultCurrencies.data)) ?? [];

      const spotInstruments =
        resultInstruments?.data?.filter(
          (market) => market.type === B2C2MarketType.SPOT,
        ) ?? [];

      const getCurrecyPairFromInstrument = (underlier = '') => {
        const quoteCurrency = currencies.find((currency) =>
          underlier.endsWith(currency),
        );
        const baseCurrency = currencies.find((currency) =>
          underlier.startsWith(currency),
        );

        return {
          quoteCurrency: b2c2Currency(quoteCurrency),
          baseCurrency: b2c2Currency(baseCurrency),
        };
      };

      // Update allowed markets
      const instruments = spotInstruments.map(
        (instrument): B2C2Market => ({
          name: instrument.name,
          underlier: instrument.underlier,
          type: instrument.type,
          isTradable: instrument.is_tradable,
          quantityPrecision: instrument.quantity_precision,
          maxQuantityPerTrade: instrument.max_quantity_per_trade,
          minQuantityPerTrade: instrument.min_quantity_per_trade,
          priceSignificantDigits: instrument.price_significant_digits,
          ...getCurrecyPairFromInstrument(instrument.underlier),
        }),
      );

      // Update allowed markets
      await this.cache.set(B2C2_CACHE.MARKETS, instruments, this.ttl + 10000);
    } catch (error) {
      this.logger.error('Failed to get symbols', {
        error: error?.response?.data,
        status: error?.response?.status,
      });

      this.updateMarketTimeout = setTimeout(async () => {
        this.updateMarketTimeout = null;
        await this.updateMarkets();
      }, 10000);
    }

    this.isUpdatingMarket = false;
  }
}
