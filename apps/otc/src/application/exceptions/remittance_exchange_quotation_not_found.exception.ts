import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { RemittanceExchangeQuotation } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'REMITTANCE_EXCHANGE_QUOTATION_NOT_FOUND')
export class RemittanceExchangeQuotationNotFoundException extends DefaultException {
  constructor(
    remittanceExchangeQuotation: Partial<RemittanceExchangeQuotation>,
  ) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_EXCHANGE_QUOTATION_NOT_FOUND',
      data: remittanceExchangeQuotation,
    });
  }
}
