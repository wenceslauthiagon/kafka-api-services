import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';

/**
 * Thrown when user limit was not found in database.
 */
@Exception(ExceptionTypes.USER, 'USER_LIMIT_NOT_FOUND')
export class UserLimitNotFoundException extends DefaultException {
  constructor(userLimit: Partial<UserLimit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_LIMIT_NOT_FOUND',
      data: userLimit,
    });
  }
}
