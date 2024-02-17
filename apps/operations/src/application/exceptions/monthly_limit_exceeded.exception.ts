import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'MONTHLY_LIMIT_EXCEEDED')
export class MonthlyLimitExceededException extends DefaultException {
  constructor(userMonthlyLimit: number, monthlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MONTHLY_LIMIT_EXCEEDED',
      data: { userMonthlyLimit, monthlyLimit },
    });
  }
}
