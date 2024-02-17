import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update min amount limit above max amount.
 */
@Exception(ExceptionTypes.USER, 'MIN_AMOUNT_LIMIT_ABOVE_MAX_AMOUNT')
export class MinAmountLimitAboveMaxAmountException extends DefaultException {
  constructor(minAmount: number, maxAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MIN_AMOUNT_LIMIT_ABOVE_MAX_AMOUNT',
      data: { minAmount, maxAmount },
    });
  }
}
