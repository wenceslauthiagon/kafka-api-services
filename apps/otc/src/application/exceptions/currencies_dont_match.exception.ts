import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Currency } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'CURRENCIES_DONT_MATCH')
export class CurrenciesDontMatchException extends DefaultException {
  constructor(currencies: Partial<Currency>[]) {
    super({
      type: ExceptionTypes.USER,
      code: 'CURRENCIES_DONT_MATCH',
      data: currencies,
    });
  }
}
