import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';

/**
 * Thrown when user tries to update your night time interval with invalid values.
 */
@Exception(ExceptionTypes.USER, 'NIGHTTIME_INTERVAL_INVALID')
export class NighttimeIntervalInvalidException extends DefaultException {
  constructor(userLimit: Partial<UserLimit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NIGHTTIME_INTERVAL_INVALID',
      data: { userLimit },
    });
  }
}
