import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update monthly limit under daily limit.
 */
@Exception(ExceptionTypes.USER, 'MONTHLY_LIMIT_UNDER_DAILY')
export class MonthlyLimitUnderDailyException extends DefaultException {
  constructor(monthlyLimit: number, dailyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MONTHLY_LIMIT_UNDER_DAILY',
      data: { monthlyLimit, dailyLimit },
    });
  }
}
