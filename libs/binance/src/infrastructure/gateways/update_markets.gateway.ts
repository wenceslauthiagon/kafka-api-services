import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { AxiosInstance } from 'axios';
import { BINANCE_CACHE, BINANCE_SERVICES } from '@zro/binance/infrastructure';
import {
  BinanceExchangeFilter,
  BinanceMarket,
  BinanceMarketType,
  BinanceRateLimit,
} from '@zro/binance/domain';

type BinanceMarketResponse = {
  timezone: string;
  serverTime: number;
  rateLimits: BinanceRateLimit[];
  exchangeFilters: BinanceExchangeFilter[];
  symbols: BinanceMarket[];
};

export class BinanceUpdateMarketsGateway {
  private readonly cache: Cache;
  private readonly logger: Logger;
  private readonly ttl: number;
  private readonly binanceFee = 10; // In BPS.

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
    this.logger = logger.child({
      context: BinanceUpdateMarketsGateway.name,
    });

    this.cache = cache;
    this.axiosInstance = axiosInstance;
    this.ttl = ttl;
  }

  /**
   * Start gateway.
   */
  start(): void {
    // Try to stop first
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
    // Avoid reentrance
    if (this.isUpdatingMarket) return;
    this.isUpdatingMarket = true;

    try {
      // Get all supported SPOT markets from Binance.
      const params = {
        permissions: BinanceMarketType.SPOT,
      };

      const response = await this.axiosInstance.get<BinanceMarketResponse>(
        BINANCE_SERVICES.MARKETS(params),
      );

      // Sanitize
      const spotMarkets = response?.data?.symbols
        ? response.data.symbols.map(
            (market): BinanceMarket => ({
              symbol: market.symbol,
              status: market.status,
              baseAsset: market.baseAsset,
              baseAssetPrecision: market.baseAssetPrecision,
              quoteAsset: market.quoteAsset,
              quotePrecision: market.quotePrecision,
              quoteAssetPrecision: market.quoteAssetPrecision,
              baseCommissionPrecision: market.baseCommissionPrecision,
              quoteCommissionPrecision: market.quoteCommissionPrecision,
              orderTypes: market.orderTypes,
              icebergAllowed: market.icebergAllowed,
              ocoAllowed: market.ocoAllowed,
              quoteOrderQtyMarketAllowed: market.quoteOrderQtyMarketAllowed,
              allowTrailingStop: market.allowTrailingStop,
              cancelReplaceAllowed: market.cancelReplaceAllowed,
              isSpotTradingAllowed: market.isSpotTradingAllowed,
              isMarginTradingAllowed: market.isMarginTradingAllowed,
              filters: market.filters,
              permissions: market.permissions,
              baseCurrencySymbol: market.baseAsset,
              quoteCurrencySymbol: market.quoteAsset,
              fee: this.binanceFee,
            }),
          )
        : [];

      await this.cache.set(
        BINANCE_CACHE.MARKETS,
        spotMarkets,
        this.ttl + 10000,
      );
    } catch (error) {
      this.logger.error('Failed to get symbols', {
        error: error?.response?.data,
        status: error?.response?.status,
      });

      // Try again in 10 seconds.
      this.updateMarketTimeout = setTimeout(() => {
        this.updateMarketTimeout = null;
        this.updateMarkets();
      }, 10000);
    }

    this.isUpdatingMarket = false;
  }
}
