import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { OrderSide, ProviderEntity, SpreadEntity } from '@zro/otc/domain';
import { User } from '@zro/users/domain';
import {
  Holiday,
  HolidayEntity,
  Quotation,
  QuotationEntity,
  StreamPairEntity,
  StreamQuotation,
  StreamQuotationEntity,
  TaxEntity,
} from '@zro/quotations/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { QuotationService } from '@zro/otc/application';
import {
  CreateQuotationServiceKafka,
  GetQuotationByIdServiceKafka,
  GetCurrentQuotationByIdServiceKafka,
  GetQuotationServiceKafka,
  GetStreamQuotationByBaseCurrencyServiceKafka,
  GetHolidayByDateServiceKafka,
} from '@zro/quotations/infrastructure';
import {
  CreateQuotationRequest,
  GetQuotationByIdRequest,
  GetCurrentQuotationByIdRequest,
  GetQuotationRequest,
  GetStreamQuotationByBaseCurrencyRequest,
  GetHolidayByDateRequest,
} from '@zro/quotations/interface';

/**
 * Quotation microservice
 */
export class QuotationServiceKafka implements QuotationService {
  static _services: any[] = [
    CreateQuotationServiceKafka,
    GetQuotationByIdServiceKafka,
    GetCurrentQuotationByIdServiceKafka,
    GetQuotationServiceKafka,
    GetStreamQuotationByBaseCurrencyServiceKafka,
    GetHolidayByDateServiceKafka,
  ];

  private readonly createQuotationService: CreateQuotationServiceKafka;
  private readonly getQuotationService: GetQuotationServiceKafka;
  private readonly getQuotationByIdService: GetQuotationByIdServiceKafka;
  private readonly getCurrentQuotationByIdService: GetCurrentQuotationByIdServiceKafka;
  private readonly getStreamQuotationByBaseCurrencyService: GetStreamQuotationByBaseCurrencyServiceKafka;
  private readonly getHolidayByDateService: GetHolidayByDateServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: QuotationServiceKafka.name });

    this.createQuotationService = new CreateQuotationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.getQuotationService = new GetQuotationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.getQuotationByIdService = new GetQuotationByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.getCurrentQuotationByIdService =
      new GetCurrentQuotationByIdServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.getStreamQuotationByBaseCurrencyService =
      new GetStreamQuotationByBaseCurrencyServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
    this.getHolidayByDateService = new GetHolidayByDateServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Call quotation for create quotation.
   * @param quotation The quotation.
   * @returns Quotation if found or null otherwise.
   */
  async createQuotation(quotation: Quotation): Promise<void> {
    const request: CreateQuotationRequest = {
      id: quotation.id,
      providerName: quotation.provider.name,
      streamPairId: quotation.streamPair.id,
      side: quotation.side,
      price: quotation.price,
      priceBuy: quotation.priceBuy,
      priceSell: quotation.priceSell,
      partialBuy: quotation.partialBuy,
      partialSell: quotation.partialSell,
      iofId: quotation.iof.id,
      iofAmount: quotation.iofAmount,
      spreadIds: quotation.spreads.map(({ id }) => id),
      spreadBuy: quotation.spreadBuy,
      spreadSell: quotation.spreadSell,
      spreadAmountBuy: quotation.spreadAmountBuy,
      spreadAmountSell: quotation.spreadAmountSell,
      quoteAmountBuy: quotation.quoteAmountBuy,
      quoteAmountSell: quotation.quoteAmountSell,
      quoteCurrencyId: quotation.quoteCurrency.id,
      quoteCurrencySymbol: quotation.quoteCurrency.symbol,
      quoteCurrencyDecimal: quotation.quoteCurrency.decimal,
      quoteCurrencyTitle: quotation.quoteCurrency.title,
      baseAmountBuy: quotation.baseAmountBuy,
      baseAmountSell: quotation.baseAmountSell,
      baseCurrencyId: quotation.baseCurrency.id,
      baseCurrencySymbol: quotation.baseCurrency.symbol,
      baseCurrencyDecimal: quotation.baseCurrency.decimal,
      baseCurrencyTitle: quotation.baseCurrency.title,
      streamQuotation: new StreamQuotationEntity(quotation.streamQuotation),
    };

    await this.createQuotationService.execute(request);
  }

  /**
   * Call quotation for get quotation from stream redis.
   * @param baseCurrency Quotation currency
   * @param amountCurrency Quotation currency
   * @param amount Quotation amount
   * @returns Quotation if found or null otherwise.
   */
  async getQuotation(
    user: User,
    baseCurrency: Currency,
    amountCurrency: Currency,
    amount: number,
    side: OrderSide,
  ): Promise<Quotation> {
    const request: GetQuotationRequest = {
      userId: user.uuid,
      amount: Number(amount),
      amountCurrencySymbol: amountCurrency.symbol,
      baseCurrencySymbol: baseCurrency.symbol,
      side,
    };

    const response = await this.getQuotationService.execute(request);

    if (!response) return null;

    return new QuotationEntity({
      id: response.id,
      side: response.side,
      price: response.price,
      priceBuy: response.priceBuy,
      priceSell: response.priceSell,
      partialBuy: response.partialBuy,
      partialSell: response.partialSell,
      iof: new TaxEntity({ id: response.iofId }),
      iofAmount: response.iofAmount,
      provider: new ProviderEntity({ name: response.providerName }),
      streamPair: new StreamPairEntity({ id: response.streamPairId }),
      spreads: response.spreadIds.map((id) => new SpreadEntity({ id })),
      spreadBuy: response.spreadBuy,
      spreadSell: response.spreadSell,
      spreadAmountBuy: response.spreadAmountBuy,
      spreadAmountSell: response.spreadAmountSell,
      quoteCurrency: new CurrencyEntity({
        id: response.quoteCurrencyId,
        title: response.quoteCurrencyTitle,
        symbol: response.quoteCurrencySymbol,
        decimal: response.quoteCurrencyDecimal,
      }),
      quoteAmountBuy: response.quoteAmountBuy,
      quoteAmountSell: response.quoteAmountSell,
      baseCurrency: new CurrencyEntity({
        id: response.baseCurrencyId,
        title: response.baseCurrencyTitle,
        symbol: response.baseCurrencySymbol,
        decimal: response.baseCurrencyDecimal,
      }),
      baseAmountBuy: response.baseAmountBuy,
      baseAmountSell: response.baseAmountSell,
      streamQuotation: new StreamQuotationEntity(response.streamQuotation),
    });
  }

  /**
   * Call quotation for get quotation by id.
   * @param quotation The quotation.
   * @returns Quotation if found or null otherwise.
   */
  async getCurrentQuotationById(quotation: Quotation): Promise<Quotation> {
    const request: GetCurrentQuotationByIdRequest = {
      id: quotation.id,
    };

    const response = await this.getCurrentQuotationByIdService.execute(request);

    if (!response) return null;

    return new QuotationEntity({
      id: response.id,
      provider: new ProviderEntity({ name: response.providerName }),
      streamPair: new StreamPairEntity({ id: response.streamPairId }),
      side: response.side,
      price: response.price,
      priceBuy: response.priceBuy,
      priceSell: response.priceSell,
      partialBuy: response.partialBuy,
      partialSell: response.partialSell,
      iof: new TaxEntity({ id: response.iofId }),
      iofAmount: response.iofAmount,
      spreads: response.spreadIds.map((id) => new SpreadEntity({ id })),
      spreadBuy: response.spreadBuy,
      spreadSell: response.spreadSell,
      spreadAmountBuy: response.spreadAmountBuy,
      spreadAmountSell: response.spreadAmountSell,
      quoteCurrency: new CurrencyEntity({
        id: response.quoteCurrencyId,
        title: response.quoteCurrencyTitle,
        symbol: response.quoteCurrencySymbol,
        decimal: response.quoteCurrencyDecimal,
      }),
      quoteAmountBuy: response.quoteAmountBuy,
      quoteAmountSell: response.quoteAmountSell,
      baseCurrency: new CurrencyEntity({
        id: response.baseCurrencyId,
        title: response.baseCurrencyTitle,
        symbol: response.baseCurrencySymbol,
        decimal: response.baseCurrencyDecimal,
      }),
      baseAmountBuy: response.baseAmountBuy,
      baseAmountSell: response.baseAmountSell,
      streamQuotation: new StreamQuotationEntity(response.streamQuotation),
    });
  }

  /**
   * Call quotation for get quotation by id.
   * @param quotation The quotation.
   * @returns Quotation if found or null otherwise.
   */
  async getQuotationById(quotation: Quotation): Promise<Quotation> {
    const request: GetQuotationByIdRequest = {
      id: quotation.id,
    };

    const response = await this.getQuotationByIdService.execute(request);

    if (!response) return null;

    return new QuotationEntity({
      id: response.id,
      provider: new ProviderEntity({ name: response.providerName }),
      streamPair: new StreamPairEntity({ id: response.streamPairId }),
      side: response.side,
      price: response.price,
      priceBuy: response.priceBuy,
      priceSell: response.priceSell,
      partialBuy: response.partialBuy,
      partialSell: response.partialSell,
      iof: new TaxEntity({ id: response.iofId }),
      iofAmount: response.iofAmount,
      spreads: response.spreadIds.map((id) => new SpreadEntity({ id })),
      spreadBuy: response.spreadBuy,
      spreadSell: response.spreadSell,
      spreadAmountBuy: response.spreadAmountBuy,
      spreadAmountSell: response.spreadAmountSell,
      quoteCurrency: new CurrencyEntity({
        id: response.quoteCurrencyId,
        title: response.quoteCurrencyTitle,
        symbol: response.quoteCurrencySymbol,
        decimal: response.quoteCurrencyDecimal,
      }),
      quoteAmountBuy: response.quoteAmountBuy,
      quoteAmountSell: response.quoteAmountSell,
      baseCurrency: new CurrencyEntity({
        id: response.baseCurrencyId,
        title: response.baseCurrencyTitle,
        symbol: response.baseCurrencySymbol,
        decimal: response.baseCurrencyDecimal,
      }),
      baseAmountBuy: response.baseAmountBuy,
      baseAmountSell: response.baseAmountSell,
      streamQuotation: new StreamQuotationEntity(response.streamQuotation),
      createdAt: response.createdAt,
    });
  }

  /**
   * Call stream quotation for get one from stream redis.
   * @param baseCurrency Quotation currency
   * @returns Quotation if found or null otherwise.
   */
  async getStreamQuotationByBaseCurrency(
    baseCurrency: Currency,
  ): Promise<StreamQuotation> {
    const request: GetStreamQuotationByBaseCurrencyRequest = {
      baseCurrencySymbol: baseCurrency.symbol,
    };

    const response =
      await this.getStreamQuotationByBaseCurrencyService.execute(request);

    if (!response) return null;

    return new StreamQuotationEntity({
      id: response.id,
      buy: response.buy,
      sell: response.sell,
      amount: response.amount,
      gatewayName: response.gatewayName,
      timestamp: response.timestamp,
      composedBy: response.composedBy,
      streamPair: response.streamPair,
      quoteCurrency: new CurrencyEntity(response.quoteCurrency),
      baseCurrency: new CurrencyEntity(response.baseCurrency),
    });
  }

  async getHolidayByDate(date: Date): Promise<Holiday> {
    const payload = new GetHolidayByDateRequest({ date });

    const response = await this.getHolidayByDateService.execute(payload);

    if (!response) return null;

    const holiday = new HolidayEntity({
      id: response.id,
      type: response.type,
      level: response.level,
      createdAt: response.createdAt,
    });

    return holiday;
  }
}
