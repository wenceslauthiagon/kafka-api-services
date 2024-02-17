import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimitRequest } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'USER_LIMIT_REQUEST_INVALID_STATE')
export class UserLimitRequestInvalidStateException extends DefaultException {
  constructor(userLimitRequest: Partial<UserLimitRequest>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_LIMIT_REQUEST_INVALID_STATE',
      data: userLimitRequest,
    });
  }
}
