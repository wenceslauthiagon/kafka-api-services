import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import axios, { AxiosInstance } from 'axios';
import {
  MercadoBitcoinSymbol,
  MercadoBitcoinSymbolType,
} from '@zro/mercado-bitcoin/domain';
import {
  MERCADO_BITCOIN_CACHE,
  MERCADO_BITCOIN_SERVICES,
} from '@zro/mercado-bitcoin/infrastructure';

type MercadoBitcoinSymbolsResponse = {
  symbol: string[];
  description: string[];
  currency: string[];
  'base-currency': string[];
  'exchange-listed': boolean[];
  'exchange-traded': boolean[];
  minmovement: string[];
  pricescale: number[];
  type: MercadoBitcoinSymbolType[];
  timezone: string[];
  'session-regular': string[];
  'withdrawal-fee': string[];
};

export class MercadoBitcoinUpdateMarketsGateway {
  private readonly cache: Cache;
  private readonly logger: Logger;
  private readonly baseURL: string;
  private readonly ttl: number;

  private updateMarketInterval: NodeJS.Timeout;
  private updateMarketTimeout: NodeJS.Timeout;
  private isUpdatingMarket = false;

  private axiosInstance: AxiosInstance;

  constructor({
    cache,
    logger,
    baseURL,
    ttl = 3600000,
  }: {
    cache: Cache;
    logger: Logger;
    baseURL: string;
    ttl?: number;
  }) {
    this.logger = logger.child({
      context: MercadoBitcoinUpdateMarketsGateway.name,
    });

    this.cache = cache;
    this.baseURL = baseURL;
    this.ttl = ttl;

    this.axiosInstance = axios.create({ baseURL: this.baseURL });
  }

  start(): void {
    this.stop();

    // Start market status monitor.
    this.updateMarketInterval = setInterval(async () => {
      await this.updateMarkets();
    }, this.ttl);

    this.updateMarketTimeout = setTimeout(() => {
      this.updateMarketTimeout = null;
      this.updateMarkets();
    }, 0);

    this.logger.info('Service started.');
  }

  /**
   * Reset all control vars
   */
  stop() {
    this.updateMarketInterval && clearInterval(this.updateMarketInterval);
    this.updateMarketTimeout && clearTimeout(this.updateMarketTimeout);
  }

  /**
   * Update markets every hour.
   */
  private async updateMarkets(): Promise<void> {
    // Avoid reentrance
    if (this.isUpdatingMarket) return;
    this.isUpdatingMarket = true;

    try {
      // Get all markets from Mercado Bitcoin.
      const result =
        await this.axiosInstance.get<MercadoBitcoinSymbolsResponse>(
          MERCADO_BITCOIN_SERVICES.SYMBOLS,
        );

      const symbols: MercadoBitcoinSymbol[] = [];

      for (let i = 0; i < result.data.symbol?.length ?? 0; i++) {
        if (
          !result.data?.symbol[i] ||
          !result.data?.currency[i] ||
          !result.data['base-currency'][i]
        ) {
          continue;
        }
        symbols.push({
          id: `${result.data.currency[i]}${result.data['base-currency'][i]}`,
          symbol: result.data.symbol[i],
          description: result.data.description[i],
          currency: result.data.currency[i],
          baseCurrency: result.data['base-currency'][i],
          exchangeListed: result.data['exchange-listed'][i],
          exchangeTraded: result.data['exchange-traded'][i],
          minmovement: result.data.minmovement[i],
          pricescale: result.data.pricescale[i],
          type: result.data.type[i],
          timezone: result.data.timezone[i],
          sessionRegular: result.data['session-regular'][i],
          withdrawalFee: result.data['withdrawal-fee'][i],
        });
      }

      // Update allowed markets
      await this.cache.set(
        MERCADO_BITCOIN_CACHE.MARKETS,
        symbols,
        this.ttl + 10000,
      );
    } catch (error) {
      this.logger.error('Failed to get symbols', {
        error: error?.response?.data,
        status: error?.response?.status,
      });

      // Try again in 5 seconds.
      this.updateMarketTimeout = setTimeout(() => {
        this.updateMarketTimeout = null;
        this.updateMarkets();
      }, 10000);
    }

    this.isUpdatingMarket = false;
  }
}
