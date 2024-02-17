import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimitRequest } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'USER_LIMIT_REQUEST_NOT_FOUND')
export class UserLimitRequestNotFoundException extends DefaultException {
  constructor(userLimitRequest: Partial<UserLimitRequest>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_LIMIT_REQUEST_NOT_FOUND',
      data: userLimitRequest,
    });
  }
}
