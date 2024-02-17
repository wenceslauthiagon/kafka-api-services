import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update max amount limit above daily limit.
 */
@Exception(ExceptionTypes.USER, 'MAX_AMOUNT_LIMIT_ABOVE_DAILY')
export class MaxAmountLimitAboveDailyException extends DefaultException {
  constructor(maxAmount: number, dailyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_AMOUNT_LIMIT_ABOVE_DAILY',
      data: { maxAmount, dailyLimit },
    });
  }
}
