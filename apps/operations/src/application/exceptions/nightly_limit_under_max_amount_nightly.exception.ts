import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update nightly limit under max amount nightly.
 */
@Exception(ExceptionTypes.USER, 'NIGHTLY_LIMIT_UNDER_MAX_AMOUNT_NIGHTLY')
export class NightlyLimitUnderMaxAmountNightlyException extends DefaultException {
  constructor(nightlyLimit: number, maxAmountNightly: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NIGHTLY_LIMIT_UNDER_MAX_AMOUNT_NIGHTLY',
      data: { nightlyLimit, maxAmountNightly },
    });
  }
}
