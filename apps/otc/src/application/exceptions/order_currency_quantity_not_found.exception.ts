import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Currency } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'ORDER_QUANTITY_CURRENCY_NOT_FOUND')
export class OrderQuantityCurrencyNotFoundException extends DefaultException {
  constructor(currency: Partial<Currency>) {
    super({
      type: ExceptionTypes.USER,
      code: 'ORDER_QUANTITY_CURRENCY_NOT_FOUND',
      data: currency,
    });
  }
}
