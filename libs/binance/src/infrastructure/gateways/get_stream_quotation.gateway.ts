import { WebSocket } from 'ws';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Cache, Milliseconds } from 'cache-manager';
import { MissingDataException } from '@zro/common';
import { BinanceMarket } from '@zro/binance/domain';
import { Currency } from '@zro/operations/domain';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
  GetStreamQuotationGatewayResponse,
} from '@zro/quotations/application';
import {
  BinanceGetCryptoMarketsGateway,
  BINANCE_PROVIDER_NAME,
} from '@zro/binance/infrastructure';

export enum BinanceChannel {
  TICKER = 'ticker',
}

enum BinanceEventType {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  LIST_SUBSCRIPTIONS = 'LIST_SUBSCRIPTIONS',
}

interface BinanceSubscribeRequest {
  method: BinanceEventType.SUBSCRIBE;
  params: string[];
  id: number;
}

interface BinanceUnsubscribeRequest {
  method: BinanceEventType.UNSUBSCRIBE;
  params: string[];
  id: number;
}

interface BinanceListSubscriptionsRequest {
  method: BinanceEventType.LIST_SUBSCRIPTIONS;
  id: number;
}

type BinanceTickerResponse = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade Id
  n: number; // Total number of trades
};

interface BinanceQuotation {
  symbol: string;
  buy: number;
  sell: number;
  baseCurrencySymbol: string;
  quoteCurrencySymbol: string;
  timestamp: number;
}

export class BinanceGetStreamQuotationGateway
  implements GetStreamQuotationGateway
{
  private readonly logger: Logger;
  private readonly cache: Cache;
  private readonly websocketURL: string;
  private readonly channel: BinanceChannel;
  private readonly marketGateway: BinanceGetCryptoMarketsGateway;
  private readonly ttl: Milliseconds;

  private readonly AMOUNT = 1; // Unity value
  private readonly REQUEST_ID = 1; // Request ID
  private readonly EVENT_TYPE = '24hrTicker'; // Ticker quotation event type.

  private ws: WebSocket;
  private subscribedMarketNames = new Set<string>();
  private isOpened = false;
  private isError = false;

  private quoteCurrencies: Currency[] = [];

  constructor({
    logger,
    cache,
    websocketURL,
    channel,
    marketGateway,
    ttl,
  }: {
    logger: Logger;
    cache: Cache;
    websocketURL: string;
    channel: BinanceChannel;
    marketGateway: BinanceGetCryptoMarketsGateway;
    ttl: number;
  }) {
    this.logger = logger.child({
      context: BinanceGetStreamQuotationGateway.name,
    });

    this.cache = cache;
    this.websocketURL = websocketURL;
    this.channel = channel;
    this.marketGateway = marketGateway;
    this.ttl = ttl;

    if (
      !this.cache ||
      !this.websocketURL ||
      !this.channel ||
      !this.marketGateway
    ) {
      throw new MissingDataException([
        ...(!this.cache ? ['Cache'] : []),
        ...(!this.websocketURL ? ['Websocket URL'] : []),
        ...(!this.channel ? ['Channel'] : []),
        ...(!this.marketGateway ? ['Get Markets Gateway'] : []),
      ]);
    }
  }

  /**
   * Set quote currencies.
   */
  setQuoteCurrencies(currencies: Currency[] = []) {
    // Sanity check.
    this.quoteCurrencies = currencies.filter(
      (quoteCurrency) => quoteCurrency.symbol,
    );
  }

  /**
   * Start gateway.
   */
  start(): void {
    if (this.ws || this.isOpened) {
      return;
    }

    this.ws = new WebSocket(this.websocketURL);

    this.ws.on('open', (): void => {
      this.logger.debug('Socket opened.');
      this.isOpened = true;
    });

    this.ws.on('error', (error: Error): void => {
      this.logger.error('Socket error.', { error: error.message });
      this.isError = true;
    });

    this.ws.on('message', async (message): Promise<void> => {
      await this.processMessage(
        JSON.parse(Buffer.from(message as Buffer).toString()),
      );
    });

    this.ws.on('close', async () => {
      this.logger.debug('Socket close.');
      if (this.isError) {
        await new Promise((r) => setTimeout(r, 30000));
      }
      this.clear();
    });

    /**
     * The websocket server will send a ping frame every 3 minutes.
     * If the websocket server does not receive a pong frame back from the connection within a 10 minute period,
     * the connection will be disconnected.
     */
    this.ws.on('ping', (): void => {
      this.logger.debug('Received ping event. Sending pong back.');
      this.ws.pong();
    });

    this.logger.info('Service started.');
  }

  private clear() {
    this.unsubscribeAll();
    this.isOpened = false;
    this.isError = false;
    this.ws = null;
  }

  stop() {
    this.ws?.close();
    this.clear();
    this.logger.debug('Stopped');
  }

  hasOrderService(): boolean {
    return true;
  }

  getProviderName(): string {
    return BINANCE_PROVIDER_NAME;
  }

  private getCacheKey(market: BinanceMarket) {
    return `${this.getProviderName()}-quotation-${market.symbol}`;
  }

  async getQuotation(
    request: GetStreamQuotationGatewayRequest,
  ): Promise<GetStreamQuotationGatewayResponse[]> {
    // Data input check
    if (!request?.baseCurrencies?.length) {
      this.logger.warn('No currencies symbols found.');
      return [];
    }

    const { baseCurrencies } = request;

    const allowedMarkets = await this.getAllowedMarkets();

    const allowedBaseCurrencies = new Set<string>(
      [...allowedMarkets].map((market) => market.baseCurrencySymbol),
    );

    // Sanitize valid base currencies
    const validBaseCurrencies = baseCurrencies
      .filter((currency) => allowedBaseCurrencies.has(currency.symbol))
      .map((currency) => currency.symbol);

    const validMarkets = [...allowedMarkets].filter((market) =>
      validBaseCurrencies.includes(market.baseCurrencySymbol),
    );

    // Sync Symbols subscription
    this.subscribe(validMarkets);

    const quotations = await Promise.all(
      validMarkets.map((market) =>
        this.cache.get<BinanceQuotation>(this.getCacheKey(market)),
      ),
    );

    // Format result
    const result = quotations
      .filter((item) => item)
      .map<GetStreamQuotationGatewayResponse>((item) => ({
        id: uuidV4(),
        baseCurrency: baseCurrencies.find(
          (currency) => currency.symbol === item.baseCurrencySymbol,
        ),
        quoteCurrency: this.quoteCurrencies.find(
          (currency) => currency.symbol === item.quoteCurrencySymbol,
        ),
        gatewayName: BINANCE_PROVIDER_NAME,
        buy: item.buy,
        sell: item.sell,
        amount: this.AMOUNT,
        timestamp: new Date(item.timestamp),
      }));

    this.logger.debug('Quotations found.', { quotations: result });

    return result;
  }

  /**
   * Get allowed markets (symbols).
   */
  private async getAllowedMarkets(): Promise<BinanceMarket[]> {
    // Get all markets from Binance.
    const spotMarkets = await this.marketGateway.getBinanceMarkets();

    const quoteCurrencySymbols = this.quoteCurrencies.map(
      (quoteCurrency) => quoteCurrency.symbol,
    );

    // Update allowed markets
    return spotMarkets?.filter((market) =>
      quoteCurrencySymbols.includes(market.quoteCurrencySymbol),
    );
  }

  /**
   * Subscribe to Binance markets.
   * @param markets List of valid subscribers.
   */
  private subscribe(markets: BinanceMarket[]): void {
    if (!this.ws || !this.isOpened) {
      // Reconnect to server
      return this.start();
    }

    const marketNames = markets.map((market) => market.symbol.toLowerCase());

    // Get new markets that aren't in the subscribed markets.
    const newMarketNames = marketNames.filter(
      (marketName) => !this.subscribedMarketNames.has(marketName),
    );

    // Unsubscribe the subscribed markets that aren't in new markets.
    this.subscribedMarketNames.forEach(
      (i) => !marketNames.includes(i) && this.unsubscribe(i),
    );

    // Subscribe new markets that aren't subscribed yet.
    newMarketNames.forEach((marketName) => {
      this.logger.info('Subscribing event.', {
        market: marketName,
        channel: this.channel,
      });

      const request: BinanceSubscribeRequest = {
        method: BinanceEventType.SUBSCRIBE,
        params: [`${marketName}@${this.channel}`],
        id: this.REQUEST_ID,
      };

      this.ws.send(JSON.stringify(request));
    });
  }

  /**
   * Unsubscribe from Binance market.
   * @param marketName Market name.
   */
  private unsubscribe(marketName: string): void {
    if (!this.ws || !this.isOpened) {
      return;
    }

    this.logger.info('Unsubscribing event.', {
      market: marketName,
      channel: this.channel,
    });

    const request: BinanceUnsubscribeRequest = {
      method: BinanceEventType.UNSUBSCRIBE,
      params: [`${marketName}@${this.channel}`],
      id: this.REQUEST_ID,
    };

    this.ws.send(JSON.stringify(request));

    this.subscribedMarketNames.delete(marketName);
  }

  /**
   * Unsubscribe from all markets at Binance.
   */
  private unsubscribeAll() {
    if (!this.ws || !this.isOpened) {
      return;
    }

    this.subscribedMarketNames.forEach((marketName) => {
      this.logger.info('Unsubscribing event.', {
        market: marketName,
        channel: this.channel,
      });

      const request: BinanceUnsubscribeRequest = {
        method: BinanceEventType.UNSUBSCRIBE,
        params: [`${this.channel}@${marketName}`],
        id: this.REQUEST_ID,
      };

      this.ws.send(JSON.stringify(request));

      this.subscribedMarketNames.delete(marketName);
    });
  }

  /**
   * List subscriptions from Binance market.
   */
  private listSubscriptions(): void {
    if (!this.ws || !this.isOpened) {
      return;
    }

    this.logger.info('Listing subscriptions event.');

    const request: BinanceListSubscriptionsRequest = {
      method: BinanceEventType.LIST_SUBSCRIPTIONS,
      id: this.REQUEST_ID,
    };

    this.ws.send(JSON.stringify(request));
  }

  /**
   * Process received message.
   * @param {Object} data Message received from Binance.
   */
  private async processMessage(data: BinanceTickerResponse): Promise<void> {
    if (!data.e || data.e !== this.EVENT_TYPE) {
      this.logger.warn('Event without success.', { data });
    } else {
      await this.handleTickerEvent(data);
    }
  }

  /**
   * Process ticker event.
   * @param {Object} event Received data.
   */
  private async handleTickerEvent(event: BinanceTickerResponse): Promise<void> {
    const ask = parseFloat(event.a);
    const bid = parseFloat(event.b);
    const marketName = event.s;
    const timestamp = event.E;

    this.subscribedMarketNames.add(marketName);

    await this.updatePrice(marketName, ask, bid, timestamp);
  }

  async updatePrice(
    marketName: string,
    ask: number,
    bid: number,
    timestamp: number,
  ): Promise<void> {
    const allowedMarkets = await this.getAllowedMarkets();

    const market = allowedMarkets.find(
      (market) => market.symbol === marketName,
    );

    if (!market) {
      return;
    }

    // Sanitize
    if (!ask || !bid) return;

    const quotation: BinanceQuotation = {
      buy: ask,
      sell: bid,
      baseCurrencySymbol: market.baseCurrencySymbol,
      quoteCurrencySymbol: market.quoteCurrencySymbol,
      symbol: marketName,
      timestamp,
    };

    await this.cache.set(this.getCacheKey(market), quotation, this.ttl);
  }
}
