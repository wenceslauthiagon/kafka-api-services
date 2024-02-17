import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Currency } from '@zro/operations/domain';

/**
 * Thrown when currency was not found in database.
 */
@Exception(ExceptionTypes.USER, 'CURRENCY_NOT_FOUND')
export class CurrencyNotFoundException extends DefaultException {
  constructor(data: Partial<Currency>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CURRENCY_NOT_FOUND',
      data,
    });
  }
}
