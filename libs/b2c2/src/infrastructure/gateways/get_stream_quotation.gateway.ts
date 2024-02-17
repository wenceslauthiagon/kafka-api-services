import { WebSocket } from 'ws';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Cache, Milliseconds } from 'cache-manager';
import { Currency } from '@zro/operations/domain';
import { B2C2Market } from '@zro/b2c2/domain';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
  GetStreamQuotationGatewayResponse,
} from '@zro/quotations/application';
import { Sanitize } from '../utils/sanitize.util';
import {
  B2C2GetCryptoMarketsGateway,
  B2C2_PROVIDER_NAME,
} from '@zro/b2c2/infrastructure';

enum B2C2EventType {
  PRICE = 'price',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  TRADABLE_INSTRUMENTS = 'tradable_instruments',
}

interface B2C2SubscribeRequest {
  event: B2C2EventType.SUBSCRIBE;
  instrument: string;
  tag: string;
  levels: number[];
}

interface B2C2TradableInstrumentEvent {
  success: boolean;
  event: B2C2EventType.TRADABLE_INSTRUMENTS;
  tradable_instruments: string[];
}

interface B2C2SubscribeEvent {
  success: boolean;
  event: B2C2EventType;
  tag: string;
  instrument: string;
  levels: number[];
}

interface B2C2Quotation {
  buy: string;
  instrument: string;
  sell: string;
  timestamp: number;
  baseCurrency: string;
  quoteCurrency: string;
}

interface B2C2PriceLevel {
  price: string;
  quantity: string;
}

interface B2C2PriceEvent {
  success: boolean;
  event: B2C2EventType;
  tag: string;
  timestamp: number;
  instrument: string;
  levels: {
    buy: B2C2PriceLevel[];
    sell: B2C2PriceLevel[];
  };
}

export class B2C2GetStreamQuotationGateway
  implements GetStreamQuotationGateway
{
  private readonly cache: Cache;
  private readonly logger: Logger;
  private readonly websocketURL: string;
  private readonly token: string;
  private readonly marketGateway: B2C2GetCryptoMarketsGateway;
  private readonly ttl: Milliseconds;

  private readonly AMOUNT = 1; // Unity value
  private readonly tag = uuidV4();

  private ws: WebSocket;
  private subscribedInstrumentNames = new Set<string>();
  private isOpenned = false;
  private isError = false;

  private quoteCurrencies: Currency[] = [];

  constructor({
    cache,
    logger,
    websocketURL,
    token,
    marketGateway,
    ttl,
  }: {
    cache: Cache;
    logger: Logger;
    websocketURL: string;
    token: string;
    marketGateway: B2C2GetCryptoMarketsGateway;
    ttl: number;
  }) {
    this.logger = logger.child({ context: B2C2GetStreamQuotationGateway.name });

    this.cache = cache;
    this.websocketURL = websocketURL;
    this.token = token;
    this.marketGateway = marketGateway;
    this.ttl = ttl;
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

  start(): void {
    if (this.ws || this.isOpenned) {
      return;
    }

    this.ws = new WebSocket(this.websocketURL, {
      headers: { Authorization: `Token ${this.token}` },
      perMessageDeflate: false,
    });

    this.ws.on('open', (): void => {
      this.logger.debug('Socket opened.');
      this.isOpenned = true;
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

    this.logger.debug('Service started.');
  }

  private clear() {
    this.unsubscribeAll();
    this.isOpenned = false;
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
    return B2C2_PROVIDER_NAME;
  }

  private getCacheKey(market: B2C2Market) {
    return `${this.getProviderName()}-quotation-${market.underlier}`;
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

    const allowedInstruments = await this.getAllowedMarkets();

    const allowedBaseCurrencySymbols = new Set<string>(
      [...allowedInstruments].map((instrument) => instrument.baseCurrency),
    );

    // Sanitize valid base currencies
    const validBaseCurrencySymbols = baseCurrencies
      .filter((currency) => allowedBaseCurrencySymbols.has(currency.symbol))
      .map((currency) => currency.symbol);

    const validInstruments = [...allowedInstruments].filter((market) =>
      validBaseCurrencySymbols.includes(market.baseCurrency),
    );

    // Sync instruments subscription
    this.subscribe(validInstruments);

    const quotations = await Promise.all(
      validInstruments.map((instrument) =>
        this.cache.get<B2C2Quotation>(this.getCacheKey(instrument)),
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
        gatewayName: B2C2_PROVIDER_NAME,
        buy: Sanitize.toFloat(item.buy),
        sell: Sanitize.toFloat(item.sell),
        amount: this.AMOUNT,
        timestamp: new Date(item.timestamp),
      }));

    this.logger.debug('Quotations found.', { quotations: result });

    return result;
  }

  /**
   * Get allowed markets (instruments).
   */
  private async getAllowedMarkets(): Promise<B2C2Market[]> {
    // Get all markets from B2C2.
    const spotMarkets = await this.marketGateway.getB2C2Markets();

    const quoteCurrencySymbols = this.quoteCurrencies.map(
      (quoteCurrency) => quoteCurrency.symbol,
    );

    // Update allowed markets
    return spotMarkets?.filter((market) =>
      quoteCurrencySymbols.includes(market.quoteCurrency),
    );
  }

  /**
   * Subscribe to B2C2.
   * @param instruments List of valid subscribers.
   */
  private subscribe(instruments: B2C2Market[]): void {
    if (!this.ws || !this.isOpenned) {
      // Reconnect to server
      return this.start();
    }

    const instrumentNames = instruments.map((instrument) => instrument.name);

    const newInstrumentNames = instrumentNames.filter(
      (instrumentName) => !this.subscribedInstrumentNames.has(instrumentName),
    );

    // unsubscribe the subscribed instruments that aren't in new instruments.
    this.subscribedInstrumentNames.forEach(
      (i) => !instrumentNames.includes(i) && this.unsubscribe(i),
    );

    // Subscribe new instruments that aren't in the subscribed instruments.
    newInstrumentNames.forEach((instrument) => {
      this.logger.debug('Subscribing event.', { instrument });

      const message: B2C2SubscribeRequest = {
        instrument,
        event: B2C2EventType.SUBSCRIBE,
        levels: [this.AMOUNT],
        tag: this.tag,
      };

      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Unsubscribe from B2C2.
   * @param instrument The instrument.
   */
  private unsubscribe(instrument: string): void {
    if (!this.ws || !this.isOpenned) {
      return;
    }

    this.logger.debug('Unsubscribing event.', { instrument });

    const unsubscribe = {
      instrument,
      event: B2C2EventType.UNSUBSCRIBE,
      tag: this.tag,
    };
    this.ws.send(JSON.stringify(unsubscribe));

    this.subscribedInstrumentNames.delete(instrument);
  }

  /**
   * Unsubscribe from B2C2.
   */
  private unsubscribeAll() {
    this.subscribedInstrumentNames.forEach((instrument) =>
      this.unsubscribe(instrument),
    );
  }

  /**
   * Process received message.
   * @param {Object} data Message received from B2C2.
   */
  private async processMessage(
    data: B2C2SubscribeEvent | B2C2PriceEvent | B2C2TradableInstrumentEvent,
  ): Promise<void> {
    if (!data.success) {
      this.logger.warn('Event without success.', { data });
    } else {
      const allowedEvents: Record<string, any> = {
        [B2C2EventType.PRICE]: this.handlePriceEvent.bind(this),
        [B2C2EventType.SUBSCRIBE]: this.handleSubscribeEvent.bind(this),
      };
      if (allowedEvents[data.event]) {
        await allowedEvents[data.event](data);
      }
    }
  }

  /**
   * Process subscribe event.
   * @param {Object} data Received data.
   */
  private handleSubscribeEvent(data: B2C2SubscribeEvent): void {
    if (data.tag !== this.tag) return;

    this.logger.debug('Event subscription received.', { data });

    this.subscribedInstrumentNames.add(data.instrument);
  }

  /**
   * Process price event.
   * @param {Object} data Received event.
   */
  private async handlePriceEvent(data: B2C2PriceEvent): Promise<void> {
    // Sanitize
    if (!data.levels?.buy?.length || !data.levels?.sell?.length) return;

    const [buy] = data.levels.buy;
    const [sell] = data.levels.sell;

    const allowedInstruments = await this.getAllowedMarkets();

    const instrument = allowedInstruments.find(
      (instrument) => instrument.name === data.instrument,
    );

    if (!instrument) return;

    // Sanitize
    if (!buy?.price || !sell?.price) return;

    const quotation: B2C2Quotation = {
      quoteCurrency: instrument.quoteCurrency,
      baseCurrency: instrument.baseCurrency,
      buy: buy.price,
      sell: sell.price,
      instrument: data.instrument,
      timestamp: data.timestamp,
    };

    await this.cache.set(this.getCacheKey(instrument), quotation, this.ttl);
  }
}
