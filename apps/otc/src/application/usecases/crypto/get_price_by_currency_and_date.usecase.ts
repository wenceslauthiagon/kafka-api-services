import { Logger } from 'winston';
import {
  formatValueFromFloatToInt,
  getMoment,
  MissingDataException,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';
import {
  HistoricalCryptoPriceGateway,
  QuotationService,
} from '@zro/otc/application';

export class GetCryptoPriceByCurrencyAndDateUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param quotationService Quotation service.
   * @param historicalCryptoPriceGateway Historical crypto price gateway.
   */
  constructor(
    private logger: Logger,
    private readonly quotationService: QuotationService,
    private readonly historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
  ) {
    this.logger = logger.child({
      context: GetCryptoPriceByCurrencyAndDateUseCase.name,
    });
  }

  /**
   * Get crypto price by currency symbol and date.
   * @param currency Currency.
   * @param date Crypto price date.
   * @returns Crypto price.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(currency: Currency, date: Date): Promise<number> {
    // Data input check
    if (!currency?.symbol || !date) {
      throw new MissingDataException([
        ...(!currency?.symbol ? ['Currency Symbol'] : []),
        ...(!date ? ['Date'] : []),
      ]);
    }

    const today = getMoment();
    const isToday = getMoment(date).isSame(today, 'day');

    let price = null;

    if (isToday) {
      const quotation =
        await this.quotationService.getStreamQuotationByBaseCurrency(currency);

      this.logger.debug('Stream quotation found.', {
        streamQuotation: {
          baseCurrency: quotation?.baseCurrency,
          quoteCurrency: quotation?.quoteCurrency,
          buy: quotation?.buy,
          sell: quotation?.sell,
        },
      });

      if (!quotation?.buy || !quotation?.sell) {
        throw new StreamQuotationNotFoundException({
          baseCurrency: currency,
        });
      }

      price = formatValueFromFloatToInt((quotation.buy + quotation.sell) / 2);
    } else {
      const gatewayResponse =
        await this.historicalCryptoPriceGateway.getHistoricalCryptoPrice({
          currency,
          createdAt: date,
        });

      this.logger.debug('Historical Crypto price.', {
        historicalCryptoPrice: gatewayResponse,
      });

      const { estimatedPrice } = gatewayResponse;

      price = estimatedPrice;
    }

    return price;
  }
}
