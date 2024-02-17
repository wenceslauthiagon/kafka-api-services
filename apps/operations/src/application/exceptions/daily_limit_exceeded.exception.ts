import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'DAILY_LIMIT_EXCEEDED')
export class DailyLimitExceededException extends DefaultException {
  constructor(userDailyLimit: number, dailyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'DAILY_LIMIT_EXCEEDED',
      data: { userDailyLimit, dailyLimit },
    });
  }
}
