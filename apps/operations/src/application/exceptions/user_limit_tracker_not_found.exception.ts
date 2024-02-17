import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimitTracker } from '@zro/operations/domain';

/**
 * Thrown when user limit tracker was not found in database.
 */
@Exception(ExceptionTypes.USER, 'USER_LIMIT_TRACKER_NOT_FOUND')
export class UserLimitTrackerNotFoundException extends DefaultException {
  constructor(userLimitTracker?: Partial<UserLimitTracker>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_LIMIT_TRACKER_NOT_FOUND',
      data: userLimitTracker,
    });
  }
}
