import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update max amount nightly limit under min amount nightly.
 */
@Exception(
  ExceptionTypes.USER,
  'MAX_AMOUNT_NIGHTLY_LIMIT_UNDER_MIN_AMOUNT_NIGHTLY',
)
export class MaxAmountNightlyLimitUnderMinAmountNightlyException extends DefaultException {
  constructor(maxAmountNigthly: number, minAmountNightly: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_NIGHTLY_LIMIT_UNDER_MIN_AMOUNT_NIGHTLY',
      data: { maxAmountNigthly, minAmountNightly },
    });
  }
}
