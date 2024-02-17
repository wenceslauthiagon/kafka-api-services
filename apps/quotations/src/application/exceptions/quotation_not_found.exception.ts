import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Quotation } from '@zro/quotations/domain';

@Exception(ExceptionTypes.USER, 'QUOTATION_NOT_FOUND')
export class QuotationNotFoundException extends DefaultException {
  constructor(quotation: Partial<Quotation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QUOTATION_NOT_FOUND',
      data: quotation,
    });
  }
}
