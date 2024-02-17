import { Logger } from 'winston';
import { isNumber } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  Tax,
  Quotation,
  QuotationEntity,
  QuotationRepository,
  StreamPair,
  StreamQuotation,
} from '@zro/quotations/domain';
import { Currency } from '@zro/operations/domain';
import { OrderSide, Spread, Provider } from '@zro/otc/domain';

export class CreateQuotationUseCase {
  constructor(
    private logger: Logger,
    private readonly quotationRepository: QuotationRepository,
  ) {
    this.logger = logger.child({ context: CreateQuotationUseCase.name });
  }

  /**
   * Create quotation.
   * @returns The added quotation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    provider: Provider,
    streamPair: StreamPair,
    side: OrderSide,
    price: number,
    priceBuy: number,
    priceSell: number,
    partialBuy: number,
    partialSell: number,
    iof: Tax,
    iofAmount: number,
    spreads: Spread[],
    spreadBuy: number,
    spreadSell: number,
    spreadAmountBuy: number,
    spreadAmountSell: number,
    quoteCurrency: Currency,
    quoteAmountBuy: number,
    quoteAmountSell: number,
    baseCurrency: Currency,
    baseAmountBuy: number,
    baseAmountSell: number,
    streamQuotation: StreamQuotation,
  ): Promise<Quotation> {
    // Data input sanitize
    if (
      !id ||
      !provider?.name ||
      !streamPair?.id ||
      !price ||
      !priceBuy ||
      !priceSell ||
      !partialBuy ||
      !partialSell ||
      !iof?.id ||
      !iofAmount ||
      !spreads?.length ||
      !isNumber(spreadBuy) ||
      !isNumber(spreadSell) ||
      !isNumber(spreadAmountBuy) ||
      !isNumber(spreadAmountSell) ||
      !quoteAmountBuy ||
      !quoteAmountSell ||
      !quoteCurrency?.id ||
      !quoteCurrency?.symbol ||
      !quoteCurrency?.title ||
      !isNumber(quoteCurrency?.decimal) ||
      !baseAmountBuy ||
      !baseAmountSell ||
      !baseCurrency?.id ||
      !baseCurrency?.symbol ||
      !baseCurrency?.title ||
      !isNumber(baseCurrency?.decimal) ||
      !streamQuotation
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!provider?.name ? ['Provider Name'] : []),
        ...(!streamPair?.id ? ['StreamPair'] : []),
        ...(!price ? ['Price'] : []),
        ...(!priceBuy ? ['Price Buy'] : []),
        ...(!priceSell ? ['Price Sell'] : []),
        ...(!partialBuy ? ['Partial Buy'] : []),
        ...(!partialSell ? ['Partial Sell'] : []),
        ...(!iof?.id ? ['Iof'] : []),
        ...(!iofAmount ? ['IOF Amount'] : []),
        ...(!spreads?.length ? ['Spreads'] : []),
        ...(!isNumber(spreadBuy) ? ['Spread Buy'] : []),
        ...(!isNumber(spreadSell) ? ['Spread Sell'] : []),
        ...(!isNumber(spreadAmountBuy) ? ['Spread Amount Buy'] : []),
        ...(!isNumber(spreadAmountSell) ? ['Spread Amount Sell'] : []),
        ...(!quoteAmountBuy ? ['Base Amount Buy'] : []),
        ...(!quoteAmountSell ? ['Base Amount Sell'] : []),
        ...(!quoteCurrency?.id ? ['Quote Currency ID'] : []),
        ...(!quoteCurrency?.symbol ? ['Quote Currency Symbol'] : []),
        ...(!quoteCurrency?.title ? ['Quote Currency Title'] : []),
        ...(!isNumber(quoteCurrency?.decimal)
          ? ['Quote Currency Decimal']
          : []),
        ...(!baseAmountBuy ? ['Base Amount Buy'] : []),
        ...(!baseAmountSell ? ['Base Amount Sell'] : []),
        ...(!baseCurrency?.id ? ['Base Currency ID'] : []),
        ...(!baseCurrency?.symbol ? ['Base Currency Symbol'] : []),
        ...(!baseCurrency?.title ? ['Base Currency Title'] : []),
        ...(!isNumber(baseCurrency?.decimal) ? ['Base Currency Decimal'] : []),
        ...(!streamQuotation ? ['Stream Quotation'] : []),
      ]);
    }

    // Check idempotency
    const foundQuotation = await this.quotationRepository.getById(id);

    this.logger.debug('Check if quotation id exists.', { foundQuotation });

    if (foundQuotation) {
      return foundQuotation;
    }

    const quotation = new QuotationEntity({
      id,
      provider,
      streamPair,
      side,
      price,
      priceBuy,
      priceSell,
      partialBuy,
      partialSell,
      iof,
      iofAmount,
      spreads,
      spreadBuy,
      spreadSell,
      spreadAmountBuy,
      spreadAmountSell,
      quoteCurrency,
      quoteAmountBuy,
      quoteAmountSell,
      baseCurrency,
      baseAmountBuy,
      baseAmountSell,
      streamQuotation,
    });

    const result = await this.quotationRepository.create(quotation);

    this.logger.debug('Quotation created.', { result });

    return result;
  }
}
