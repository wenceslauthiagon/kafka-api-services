import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ExchangeQuotation } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'EXCHANGE_QUOTATION_NOT_FOUND')
export class ExchangeQuotationNotFoundException extends DefaultException {
  constructor(exchangeQuotation: Partial<ExchangeQuotation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_QUOTATION_NOT_FOUND',
      data: exchangeQuotation,
    });
  }
}
