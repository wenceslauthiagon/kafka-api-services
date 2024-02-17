import { WebSocket } from 'ws';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Cache, Milliseconds } from 'cache-manager';
import { Currency } from '@zro/operations/domain';
import { MercadoBitcoinSymbol } from '@zro/mercado-bitcoin/domain';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
  GetStreamQuotationGatewayResponse,
} from '@zro/quotations/application';
import {
  MercadoBitcoinGetCryptoMarketsGateway,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from '@zro/mercado-bitcoin/infrastructure';

export enum MercadoBitcoinSubscribeType {
  TICKER = 'ticker',
  ORDERBOOK = 'orderbook',
  TRADES = 'trades',
}
enum MercadoBitcoinRequestType {
  PING = 'ping',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
}

type MercadoBitcoinSubscribeDetails = {
  id: string; // Market id. Ex: BRLBTC.
  name: MercadoBitcoinSubscribeType; // Subscription type.

  /**
   * Limits the book depth.
   * Available only for orderbook.
   * Possible values: 10, 20, 50, 100, 200.
   */
  limit?: number;
};

class MercadoBitcoinSubscribeRequest {
  private type: MercadoBitcoinRequestType;

  constructor(private subscription: MercadoBitcoinSubscribeDetails) {
    this.type = MercadoBitcoinRequestType.SUBSCRIBE;
  }
}

type MercadoBitcoinUnsubscribeDetails = MercadoBitcoinSubscribeDetails;

class MercadoBitcoinUnsubscribeRequest extends MercadoBitcoinSubscribeRequest {
  constructor(subscription: MercadoBitcoinUnsubscribeDetails) {
    super(subscription);
  }
}

class MercadoBitcoinPingRequest {
  type: MercadoBitcoinRequestType;

  constructor() {
    this.type = MercadoBitcoinRequestType.PING;
  }
}

enum MercadoBitcoinEventType {
  PONG = 'pong',
  ORDERBOOK = 'orderbook',
  TICKER = 'ticker',
}

type MercadoBitcoinOrderbookData = {
  timestamp: object; //	Unix timestamp in nanoseconds when the orderbook is generated.
  asks: number[][]; // Array of [price, volume]
  bids: number[][]; // Array of [price, volume]
};

interface MercadoBitcoinOrderbookEvent {
  type: MercadoBitcoinEventType;
  ts: number;
  id: string;
  data: MercadoBitcoinOrderbookData;
}

type MercadoBitcoinTickerData = {
  high: string;
  low: string;
  last: string;
  buy: string;
  sell: string;
  open: string;
  vol: string;
  date: number;
};

interface MercadoBitcoinTickerEvent {
  type: MercadoBitcoinEventType;
  ts: number;
  id: string;
  data: MercadoBitcoinTickerData;
}

interface MercadoBitcoinQuotation {
  marketName: string;
  quoteCurrency: string;
  baseCurrency: string;
  buy: number;
  sell: number;
  timestamp: number;
}

export class MercadoBitcoinGetStreamQuotationGateway
  implements GetStreamQuotationGateway
{
  private readonly cache: Cache;
  private readonly logger: Logger;
  private readonly websocketURL: string;
  private readonly subscriptionType: MercadoBitcoinSubscribeType;
  private readonly orderbookDepth: number;
  private readonly marketGateway: MercadoBitcoinGetCryptoMarketsGateway;
  private readonly ttl: Milliseconds;

  private readonly AMOUNT = 1; // Unity value

  private ws: WebSocket;
  private isOpenned = false;
  private subscribedMarketIds = new Set<string>();

  private pingInterval: NodeJS.Timeout;

  private quoteCurrencies: Currency[] = [];

  constructor({
    cache,
    logger,
    websocketURL,
    subscriptionType,
    orderbookDepth = 100,
    marketGateway,
    ttl,
  }: {
    cache: Cache;
    logger: Logger;
    websocketURL: string;
    subscriptionType: MercadoBitcoinSubscribeType;
    orderbookDepth?: number;
    marketGateway: MercadoBitcoinGetCryptoMarketsGateway;
    ttl: number;
  }) {
    this.logger = logger.child({
      context: MercadoBitcoinGetStreamQuotationGateway.name,
    });

    this.cache = cache;
    this.websocketURL = websocketURL;
    this.subscriptionType = subscriptionType;
    this.orderbookDepth = orderbookDepth;
    this.marketGateway = marketGateway;
    this.ttl = ttl;
  }

  /**
   * Set quote currencies.
   */
  setQuoteCurrencies(currencies: Currency[] = []) {
    this.quoteCurrencies = currencies.filter(
      (quoteCurrency) => quoteCurrency.symbol,
    );
  }

  start(): void {
    if (this.ws || this.isOpenned) {
      return;
    }

    // Reset all control vars.
    this.clear();

    // Open websocket.
    this.ws = new WebSocket(this.websocketURL);

    this.ws.on('open', (): void => {
      this.logger.debug('Socket opened.');
      this.isOpenned = true;
    });

    this.ws.on('error', (error: Error): void => {
      this.logger.error('Socket error.', { error: error.message });
    });

    this.ws.on('message', async (message: Buffer): Promise<void> => {
      const parsedMessage = JSON.parse(Buffer.from(message).toString());
      await this.processMessage(parsedMessage);
    });

    this.ws.on('close', () => {
      this.logger.debug('Socket close.');
      this.clear();
    });

    // Start ping message.
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 4000);

    this.logger.info('Service started.');
  }

  /**
   * Reset all control vars
   */
  private clear() {
    this.unsubscribeAll();
    this.pingInterval && clearInterval(this.pingInterval);
    this.isOpenned = false;
    this.ws = null;
  }

  /**
   * Stop gateway.
   */
  stop() {
    this.ws?.close();
    this.clear();
    this.logger.debug('Stopped');
  }

  hasOrderService(): boolean {
    return true;
  }

  getProviderName(): string {
    return MERCADO_BITCOIN_PROVIDER_NAME;
  }

  private getCacheKey(market: MercadoBitcoinSymbol) {
    return `${this.getProviderName()}-quotation-${market.symbol}-${
      this.subscriptionType
    }`;
  }

  /**
   * Get allowed markets.
   */
  private async getAllowedMarkets(): Promise<MercadoBitcoinSymbol[]> {
    // Get all markets from Mercado Bitcoin.
    const spotMarkets = await this.marketGateway.getMercadoBitcoinMarkets();

    const quoteCurrencySymbols = this.quoteCurrencies.map(
      (quoteCurrency) => quoteCurrency.symbol,
    );

    // Update allowed markets
    return spotMarkets?.filter((market) =>
      quoteCurrencySymbols.includes(market.currency),
    );
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

    const allowedBaseCurrencies = allowedMarkets.map(
      (market) => market.baseCurrency,
    );

    // Sanitize valid markets
    const validBaseCurrencySymbols = baseCurrencies
      .filter((currency) => allowedBaseCurrencies.includes(currency.symbol))
      .map((currency) => currency.symbol);

    const validMarkets = allowedMarkets.filter((market) =>
      validBaseCurrencySymbols.includes(market.baseCurrency),
    );

    // Sync instruments subscription
    this.subscribe(validMarkets);

    const quotations = await Promise.all(
      validMarkets.map((market) =>
        this.cache.get<MercadoBitcoinQuotation>(this.getCacheKey(market)),
      ),
    );

    // Format result
    const result = quotations
      .filter((item) => item)
      .map<GetStreamQuotationGatewayResponse>((item) => ({
        id: uuidV4(),
        baseCurrency: baseCurrencies.find(
          (currency) => currency.symbol === item.baseCurrency,
        ),
        quoteCurrency: this.quoteCurrencies.find(
          (currency) => currency.symbol === item.quoteCurrency,
        ),
        gatewayName: MERCADO_BITCOIN_PROVIDER_NAME,
        buy: item.buy,
        sell: item.sell,
        amount: this.AMOUNT,
        timestamp: new Date(item.timestamp / 1000000),
      }));

    this.logger.debug('Quotations found.', { quotations: result });

    return result;
  }

  /**
   * Ping Mercado Bitcoin every 4 sec because in 5 sec socket will be closed.
   */
  private ping(): void {
    if (this.ws && this.isOpenned) {
      const request = new MercadoBitcoinPingRequest();
      this.ws?.send(JSON.stringify(request));
      this.logger.debug('Ping');
    }
  }

  /**
   * Subscribe to Mercado Bitcoin markets.
   * @param markets List of valid markets.
   */
  private subscribe(markets: MercadoBitcoinSymbol[]): void {
    if (!this.ws || !this.isOpenned) {
      // Reconnect to server
      return this.start();
    }

    const marketIds = markets.map((market) => market.id);

    // Get new markets that aren't in the subscribed markets.
    const newMarketIds = marketIds.filter(
      (symbol) => !this.subscribedMarketIds.has(symbol),
    );

    // Unsubscribe the subscribed markets that aren't in new markets.
    this.subscribedMarketIds.forEach(
      (id) => !marketIds.includes(id) && this.unsubscribe(id),
    );

    // Subscribe new markets.
    newMarketIds.forEach((id) => {
      this.logger.debug('Subscribing event.', { market: id });
      const request = new MercadoBitcoinSubscribeRequest({
        id,
        limit: this.orderbookDepth,
        name: this.subscriptionType,
      });
      this.ws.send(JSON.stringify(request));
      this.subscribedMarketIds.add(id);
    });
  }

  /**
   * Unsubscribe from a market at Mercado Bitcoin.
   * @param market The instrument.
   */
  private unsubscribe(marketId: string): void {
    if (!this.ws || !this.isOpenned) {
      return;
    }

    this.logger.debug('Unsubscribing event.', { market: marketId });

    const request = new MercadoBitcoinUnsubscribeRequest({
      id: marketId,
      limit: this.orderbookDepth,
      name: this.subscriptionType,
    });
    this.ws.send(JSON.stringify(request));

    this.subscribedMarketIds.delete(marketId);
  }

  /**
   * Unsubscribe from all markets at Mercado Bitcoin.
   */
  private unsubscribeAll() {
    this.subscribedMarketIds.forEach((market) => this.unsubscribe(market));
  }

  /**
   * Process received message.
   * @param {Object} data Message received from Mercado Bitcoin.
   */
  private async processMessage(
    data: MercadoBitcoinOrderbookEvent,
  ): Promise<void> {
    const allowedEvents: Record<string, any> = {
      [MercadoBitcoinEventType.PONG]: this.handlePongEvent.bind(this),
      [MercadoBitcoinEventType.ORDERBOOK]: this.handleOrderbookEvent.bind(this),
      [MercadoBitcoinEventType.TICKER]: this.handleTickerEvent.bind(this),
    };
    if (allowedEvents[data.type]) {
      await allowedEvents[data.type](data);
    }
  }

  /**
   * Process pong event.
   */
  private handlePongEvent(): void {
    this.logger.debug('Pong');
  }

  /**
   * Process orderbook event.
   * @param event Received event.
   */
  private async handleOrderbookEvent(
    event: MercadoBitcoinOrderbookEvent,
  ): Promise<void> {
    if (!event?.data?.asks?.length || !event?.data?.bids?.length) return;

    const asks = event.data.asks;
    const bids = event.data.bids;

    const reduceBook = (acc, cur) => {
      acc.volume += cur[1];
      acc.price += cur[0] * cur[1];

      return acc;
    };

    const askTotal = asks.reduce(reduceBook, { volume: 0, price: 0 });
    const bidTotal = bids.reduce(reduceBook, { volume: 0, price: 0 });

    const askPrice = askTotal.volume && askTotal.price / askTotal.volume;
    const bidPrice = bidTotal.volume && bidTotal.price / bidTotal.volume;

    return this.updatePrice(event.id, askPrice, bidPrice, event.ts);
  }

  /**
   * Process ticker event.
   * @param event Received event.
   */
  private async handleTickerEvent(
    event: MercadoBitcoinTickerEvent,
  ): Promise<void> {
    const ask = event.data?.buy && parseFloat(event.data.buy);
    const bid = event.data?.sell && parseFloat(event.data.sell);
    const marketName = event.id;
    const timestamp = event.data?.date ?? Date.now();

    return this.updatePrice(marketName, ask, bid, timestamp);
  }

  private async updatePrice(
    marketName: string,
    ask: number,
    bid: number,
    timestamp: number,
  ): Promise<void> {
    const allowedMarkets = await this.getAllowedMarkets();

    const [market] = allowedMarkets.filter(
      (market) => market.id === marketName,
    );

    if (!market) {
      return;
    }

    const quotation: MercadoBitcoinQuotation = {
      buy: ask,
      sell: bid,
      marketName: market.id,
      timestamp: timestamp,
      baseCurrency: market.baseCurrency,
      quoteCurrency: market.currency,
    };

    await this.cache.set(this.getCacheKey(market), quotation, this.ttl);
  }
}
