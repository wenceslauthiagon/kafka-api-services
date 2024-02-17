import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation under its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'MIN_AMOUNT_NIGHTLY_LIMIT_BELOW')
export class MinAmountNightlyLimitBelowException extends DefaultException {
  constructor(
    userMinAmountNightlyLimit: number,
    minAmountNightlyLimit: number,
  ) {
    super({
      type: ExceptionTypes.USER,
      code: 'MIN_AMOUNT_NIGHTLY_LIMIT_BELOW',
      data: { userMinAmountNightlyLimit, minAmountNightlyLimit },
    });
  }
}
