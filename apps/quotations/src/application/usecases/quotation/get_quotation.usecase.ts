import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isNumber } from 'class-validator';
import {
  formatValueFromFloatToInt,
  formatValueFromIntToFloat,
  MissingDataException,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  OrderSide,
  ProviderEntity,
  Spread,
  SpreadEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  StreamQuotationRepository,
  Quotation,
  QuotationEntity,
  QuotationRepository,
  StreamPairRepository,
  StreamQuotation,
  TaxRepository,
  HolidayRepository,
} from '@zro/quotations/domain';
import {
  TaxNotFoundException,
  StreamQuotationNotFoundException,
  OtcService,
  QuotationAmountUnderMinAmountException,
} from '@zro/quotations/application';
import { SpreadNotFoundException } from '@zro/otc/application';

export class GetQuotationUseCase {
  /**
   * The bps decimal value (ex: 1% = 100 bps)
   */
  private readonly BPS_DECIMAL = 4;

  constructor(
    private logger: Logger,
    private readonly streamPairRepository: StreamPairRepository,
    private readonly streamQuotationRepository: StreamQuotationRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly taxRepository: TaxRepository,
    private readonly holidayRepository: HolidayRepository,
    private readonly otcService: OtcService,
    private readonly operationCurrencySymbol: string,
    private readonly otcTaxIofName: string,
  ) {
    this.logger = logger.child({ context: GetQuotationUseCase.name });
  }

  /**
   * Get current quotation.
   * @returns The quotation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    amount: number,
    amountCurrency: Currency,
    baseCurrency: Currency,
    side: OrderSide,
  ): Promise<Quotation> {
    // Checking missing params
    if (!user || !amount || !amountCurrency || !baseCurrency || !side) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!amountCurrency ? ['Amount currency'] : []),
        ...(!baseCurrency ? ['Base currency'] : []),
        ...(!side ? ['Side'] : []),
      ]);
    }

    let quoteCurrency = new CurrencyEntity({
      symbol: this.operationCurrencySymbol,
    });

    const activeStreamPairs =
      await this.streamPairRepository.getAllActiveIsTrue();

    const streamQuotationsFound: StreamQuotation[] = [];

    for (const activeStreamPair of activeStreamPairs) {
      const streamQuotation =
        await this.streamQuotationRepository.getByBaseCurrencyAndQuoteCurrencyAndName(
          baseCurrency,
          quoteCurrency,
          activeStreamPair.gatewayName,
        );

      if (streamQuotation) {
        streamQuotationsFound.push(streamQuotation);
      }
    }

    this.logger.debug('StreamQuotations found.', { streamQuotationsFound });

    if (!streamQuotationsFound.length) {
      throw new StreamQuotationNotFoundException({
        baseCurrency,
        quoteCurrency,
      });
    }

    // Sort quotations by priority
    const [streamQuotationFound] = streamQuotationsFound.sort(
      (a, b) => a.streamPair.priority - b.streamPair.priority,
    );

    // Update currency params with full data
    baseCurrency = streamQuotationFound.baseCurrency;
    quoteCurrency = streamQuotationFound.quoteCurrency;

    // Average price between buy and sell
    const price = (streamQuotationFound.buy + streamQuotationFound.sell) / 2;

    // Get all currencies in quotation composedBy pairs
    const composedBy = streamQuotationFound.composedBy ?? [
      streamQuotationFound,
    ];
    const currencies = composedBy.map((item) => item.baseCurrency);

    const spreadsFound = await this.otcService.getSpreadsByUserAndCurrencies(
      user,
      currencies,
    );
    // Sanitize check
    if (!spreadsFound?.length) {
      throw new SpreadNotFoundException({ user, currency: baseCurrency });
    }

    const iofFound = await this.taxRepository.getByName(this.otcTaxIofName);
    this.logger.debug('Tax found.', { taxFound: iofFound });
    // Sanitize check
    if (!iofFound) {
      throw new TaxNotFoundException({ name: this.otcTaxIofName });
    }

    // Get the reduced total spread of found spreads
    const totalSpread = await this.getComposedSpread(spreadsFound);

    const quotation = new QuotationEntity({
      id: uuidV4(),
      streamQuotation: streamQuotationFound,
      streamPair: streamQuotationFound.streamPair,
      provider: new ProviderEntity({ name: streamQuotationFound.gatewayName }),
      side,
      price,
      iof: iofFound,
      spreads: spreadsFound,
      spreadBuy: totalSpread.buy,
      spreadSell: totalSpread.sell,
      quoteCurrency,
      baseCurrency,
    });

    // Format value ​​for calculation
    amountCurrency =
      amountCurrency.symbol === quoteCurrency.symbol
        ? quoteCurrency
        : baseCurrency;
    amount = formatValueFromIntToFloat(amount, amountCurrency.decimal);

    if (amountCurrency.symbol === quoteCurrency.symbol) {
      quotation.quoteAmountBuy = amount;
      quotation.quoteAmountSell = amount;

      quotation.iofAmount = iofFound.valueFloat * amount;

      quotation.spreadAmountBuy =
        totalSpread.buyFloat * quotation.quoteAmountBuy;
      quotation.spreadAmountSell =
        totalSpread.sellFloat * quotation.quoteAmountSell;

      quotation.partialBuy =
        quotation.quoteAmountBuy -
        quotation.spreadAmountBuy -
        quotation.iofAmount;
      quotation.partialSell =
        quotation.quoteAmountSell +
        quotation.spreadAmountSell +
        quotation.iofAmount;

      quotation.baseAmountBuy = quotation.partialBuy / price;
      quotation.baseAmountSell = quotation.partialSell / price;
    } else {
      quotation.baseAmountBuy = amount;
      quotation.baseAmountSell = amount;

      const partial = price * amount;

      quotation.iofAmount = iofFound.valueFloat * partial;

      quotation.spreadAmountBuy = totalSpread.buyFloat * partial;
      quotation.spreadAmountSell = totalSpread.sellFloat * partial;

      quotation.quoteAmountBuy =
        partial + quotation.spreadAmountBuy + quotation.iofAmount;
      quotation.quoteAmountSell =
        partial - quotation.spreadAmountSell - quotation.iofAmount;

      quotation.partialBuy = partial;
      quotation.partialSell = partial;
    }

    quotation.priceBuy = quotation.quoteAmountBuy / quotation.baseAmountBuy;
    quotation.priceSell = quotation.quoteAmountSell / quotation.baseAmountSell;

    this.formatValues(quotation, quoteCurrency.decimal, baseCurrency.decimal);

    /**
     * Check minimum quotation amount is enough to create it.
     * Throw exception when:
     * iof is 0; or
     * spread buy/sell is less than iof and spread amount buy/sell is 0;
     */
    if (
      quotation.iofAmount <= 0 ||
      (totalSpread.buyFloat > 0 &&
        totalSpread.buyFloat < iofFound.valueFloat &&
        quotation.spreadAmountBuy <= 0) ||
      (totalSpread.sellFloat > 0 &&
        totalSpread.sellFloat < iofFound.valueFloat &&
        quotation.spreadAmountSell <= 0)
    ) {
      throw new QuotationAmountUnderMinAmountException(quotation);
    }

    await this.quotationRepository.create(quotation);

    this.logger.debug('Quotation created.', { quotation });

    return quotation;
  }

  /**
   * Get the final spread with the total amounts when the currency spread has an offMarket value.
   * This method checks if the current day is a holiday or outside market hours.
   *
   * @param spreads The payload
   */
  private async getComposedSpread(spreads: Spread[]): Promise<Spread> {
    // Get current timestamp without seconds.
    const now = getMoment().startOf('minute');
    // Get a holiday by today
    const isHoliday = await this.holidayRepository.getByDate(
      getMoment(now).startOf('day').toDate(),
    );

    // Build composed spread.
    const composed: Pick<Spread, 'buyFloat' | 'sellFloat'> = spreads.reduce(
      (acc, spread) => {
        // Check if today is a holiday or if today is a weekday,
        // and if the hour is in off market time.
        const isOffMarket = isHoliday || spread.isInOffMarketInterval(now);

        // Check if spread has some off market value or uses the default value.
        spread.offMarketBuy = isNumber(spread.offMarketBuy)
          ? spread.offMarketBuy
          : spread.buy;
        spread.offMarketSell = isNumber(spread.offMarketSell)
          ? spread.offMarketSell
          : spread.sell;

        // Apply compound interest.
        acc.buyFloat *=
          1 + (isOffMarket ? spread.offMarketBuyFloat : spread.buyFloat);
        acc.sellFloat *=
          1 + (isOffMarket ? spread.offMarketSellFloat : spread.sellFloat);

        return acc;
      },
      { buyFloat: 1, sellFloat: 1 },
    );

    // Subtract initial value.
    composed.buyFloat -= 1;
    composed.sellFloat -= 1;

    const spreadTotal = new SpreadEntity({
      buy: formatValueFromFloatToInt(composed.buyFloat, this.BPS_DECIMAL),
      sell: formatValueFromFloatToInt(composed.sellFloat, this.BPS_DECIMAL),
    });

    return spreadTotal;
  }

  /**
   * Format amounts ​​and prices according to currency decimal.
   * This method mutates the received object.
   *
   * @param data The payload
   * @param quoteDecimal The quote currency decimal
   * @param baseDecimal The base currency decimal
   */
  private formatValues(
    data: Quotation,
    quoteDecimal: number,
    baseDecimal: number,
  ): void {
    data.iofAmount = formatValueFromFloatToInt(data.iofAmount, quoteDecimal);

    data.spreadAmountBuy = formatValueFromFloatToInt(
      data.spreadAmountBuy,
      quoteDecimal,
    );
    data.spreadAmountSell = formatValueFromFloatToInt(
      data.spreadAmountSell,
      quoteDecimal,
    );

    data.partialBuy = formatValueFromFloatToInt(data.partialBuy, quoteDecimal);
    data.partialSell = formatValueFromFloatToInt(
      data.partialSell,
      quoteDecimal,
    );

    data.price = formatValueFromFloatToInt(data.price, quoteDecimal);
    data.priceBuy = formatValueFromFloatToInt(data.priceBuy, quoteDecimal);
    data.priceSell = formatValueFromFloatToInt(data.priceSell, quoteDecimal);

    data.baseAmountBuy = formatValueFromFloatToInt(
      data.baseAmountBuy,
      baseDecimal,
    );
    data.baseAmountSell = formatValueFromFloatToInt(
      data.baseAmountSell,
      baseDecimal,
    );
    data.quoteAmountBuy = formatValueFromFloatToInt(
      data.quoteAmountBuy,
      quoteDecimal,
    );
    data.quoteAmountSell = formatValueFromFloatToInt(
      data.quoteAmountSell,
      quoteDecimal,
    );
  }
}
