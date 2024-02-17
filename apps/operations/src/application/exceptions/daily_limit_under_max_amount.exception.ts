import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update daily limit under max amount limit.
 */
@Exception(ExceptionTypes.USER, 'DAILY_LIMIT_UNDER_MAX_AMOUNT')
export class DailyLimitUnderMaxAmountException extends DefaultException {
  constructor(dailyLimit: number, maxAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'DAILY_LIMIT_UNDER_MAX_AMOUNT',
      data: { dailyLimit, maxAmount },
    });
  }
}
