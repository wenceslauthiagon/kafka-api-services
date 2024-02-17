import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ExchangeQuotation } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'EXCHANGE_QUOTATION_INVALID_STATE')
export class ExchangeQuotationInvalidStateException extends DefaultException {
  constructor(exchangeQuotation: Partial<ExchangeQuotation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_QUOTATION_INVALID_STATE',
      data: exchangeQuotation,
    });
  }
}
