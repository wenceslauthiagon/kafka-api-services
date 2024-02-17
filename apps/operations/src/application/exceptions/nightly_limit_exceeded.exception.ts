import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'NIGHTLY_LIMIT_EXCEEDED')
export class NightlyLimitExceededException extends DefaultException {
  constructor(userNightlyLimit: number, nightlyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NIGHTLY_LIMIT_EXCEEDED',
      data: { userNightlyLimit, nightlyLimit },
    });
  }
}
