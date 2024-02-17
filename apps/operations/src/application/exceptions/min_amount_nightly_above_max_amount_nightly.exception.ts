import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update min amount nightly limit above max amount nightly.
 */
@Exception(
  ExceptionTypes.USER,
  'MIN_AMOUNT_NIGHTLY_LIMIT_ABOVE_MAX_AMOUNT_NIGHTLY',
)
export class MinAmountNightlyLimitAboveMaxAmountException extends DefaultException {
  constructor(minAmountNightly: number, maxAmountNightly: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MIN_AMOUNT_NIGHTLY_LIMIT_ABOVE_MAX_AMOUNT_NIGHTLY',
      data: { minAmountNightly, maxAmountNightly },
    });
  }
}
