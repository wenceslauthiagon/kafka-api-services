import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Currency } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'CURRENCY_INVALID_TYPE')
export class CurrencyInvalidTypeException extends DefaultException {
  constructor(data: Partial<Currency>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CURRENCY_INVALID_TYPE',
      data,
    });
  }
}
