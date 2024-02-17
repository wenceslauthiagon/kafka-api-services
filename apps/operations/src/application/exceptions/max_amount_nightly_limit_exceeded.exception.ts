import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'MAX_AMOUNT_NIGHTLY_LIMIT_EXCEEDED')
export class MaxAmountNightlyLimitExceededException extends DefaultException {
  constructor(
    userMaxAmountNightlyLimit: number,
    maxAmountNightlyLimit: number,
  ) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_NIGHTLY_LIMIT_EXCEEDED',
      data: { userMaxAmountNightlyLimit, maxAmountNightlyLimit },
    });
  }
}
