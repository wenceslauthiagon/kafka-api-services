import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_IS_ALREADY_CHANGE_PASSWORD')
export class UserIsAlreadyChangePasswordException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_IS_ALREADY_CHANGE_PASSWORD',
      data: user,
    });
  }
}
