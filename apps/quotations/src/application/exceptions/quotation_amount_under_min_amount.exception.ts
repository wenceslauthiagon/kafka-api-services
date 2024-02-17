import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Quotation } from '@zro/quotations/domain';

/**
 * Thrown when user tries to quote an amount under min amount.
 */
@Exception(ExceptionTypes.USER, 'QUOTATION_AMOUNT_UNDER_MIN_AMOUNT')
export class QuotationAmountUnderMinAmountException extends DefaultException {
  constructor(data: Partial<Quotation>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QUOTATION_AMOUNT_UNDER_MIN_AMOUNT',
      data,
    });
  }
}
