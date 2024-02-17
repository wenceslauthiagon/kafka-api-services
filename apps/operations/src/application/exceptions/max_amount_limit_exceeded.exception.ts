import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'MAX_AMOUNT_LIMIT_EXCEEDED')
export class MaxAmountLimitExceededException extends DefaultException {
  constructor(userMaxAmountLimit: number, maxAmountLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_LIMIT_EXCEEDED',
      data: { userMaxAmountLimit, maxAmountLimit },
    });
  }
}
