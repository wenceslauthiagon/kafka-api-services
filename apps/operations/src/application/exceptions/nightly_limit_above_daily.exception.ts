import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when compliance tries to update nightly limit above daily limit.
 */
@Exception(ExceptionTypes.USER, 'NIGHTLY_LIMIT_ABOVE_DAILY')
export class NightlyLimitAboveDailyException extends DefaultException {
  constructor(nightlyLimit: number, dailyLimit: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NIGHTLY_LIMIT_ABOVE_DAILY',
      data: { nightlyLimit, dailyLimit },
    });
  }
}
