import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'YEARLY_LIMIT_EXCEEDED')
export class YearlyLimitExceededException extends DefaultException {
  constructor(userYearlyLimit: number, yearlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'YEARLY_LIMIT_EXCEEDED',
      data: { userYearlyLimit, yearlyLimit },
    });
  }
}
