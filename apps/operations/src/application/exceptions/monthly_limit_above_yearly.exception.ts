import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update monthly limit above yearly limit.
 */
@Exception(ExceptionTypes.USER, 'MONTHLY_LIMIT_ABOVE_YEARLY')
export class MonthlyLimitAboveYearlyException extends DefaultException {
  constructor(monthlyLimit: number, yearlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MONTHLY_LIMIT_ABOVE_YEARLY',
      data: { monthlyLimit, yearlyLimit },
    });
  }
}
