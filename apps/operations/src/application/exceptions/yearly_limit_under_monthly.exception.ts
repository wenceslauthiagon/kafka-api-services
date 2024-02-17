import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to set yearly limit under monthly limit.
 */
@Exception(ExceptionTypes.USER, 'YEARLY_LIMIT_UNDER_MONTHLY')
export class YearlyLimitUnderMonthlyException extends DefaultException {
  constructor(yearlyLimit: number, monthlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'YEARLY_LIMIT_UNDER_MONTHLY',
      data: { yearlyLimit, monthlyLimit },
    });
  }
}
