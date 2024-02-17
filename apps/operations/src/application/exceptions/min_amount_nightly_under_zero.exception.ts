import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update min amount nightly limit under zero.
 */
@Exception(ExceptionTypes.USER, 'MIN_AMOUNT_NIGHTLY_UNDER_ZERO')
export class MinAmountNightlyLimitUnderZeroException extends DefaultException {
  constructor(minAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MIN_AMOUNT_NIGHTLY_UNDER_ZERO',
      data: { minAmount },
    });
  }
}
