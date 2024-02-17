import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update daily limit above monthly limit.
 */
@Exception(ExceptionTypes.USER, 'DAILY_LIMIT_ABOVE_MONTHLY')
export class DailyLimitAboveMonthlyException extends DefaultException {
  constructor(dailyLimit: number, monthlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'DAILY_LIMIT_ABOVE_MONTHLY',
      data: { dailyLimit, monthlyLimit },
    });
  }
}
