import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Currency } from '@zro/operations/domain';

/**
 * Thrown when currency was not active in database.
 */
@Exception(ExceptionTypes.USER, 'CURRENCY_NOT_ACTIVE')
export class CurrencyNotActiveException extends DefaultException {
  constructor(data: Partial<Currency>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CURRENCY_NOT_ACTIVE',
      data,
    });
  }
}
