import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update max amount nightly limit above nightly limit.
 */
@Exception(ExceptionTypes.USER, 'MAX_AMOUNT_NIGHTLY_ABOVE_NIGHTLY')
export class MaxAmountNightlyLimitAboveNightlyException extends DefaultException {
  constructor(maxAmountNightly: number, nightlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_NIGHTLY_ABOVE_NIGHTLY',
      data: { maxAmountNightly, nightlyLimit },
    });
  }
}
