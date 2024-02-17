import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update max amount limit under min amount.
 */
@Exception(ExceptionTypes.USER, 'MAX_AMOUNT_LIMIT_UNDER_MIN_AMOUNT')
export class MaxAmountLimitUnderMinAmountException extends DefaultException {
  constructor(maxAmount: number, minAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_LIMIT_UNDER_MIN_AMOUNT',
      data: { maxAmount, minAmount },
    });
  }
}
