import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_INVALID_STATE')
export class UserInvalidStateException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_INVALID_STATE',
      data: user,
    });
  }
}
