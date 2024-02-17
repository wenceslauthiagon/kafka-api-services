import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_PIN_NOT_FOUND')
export class UserPinNotFoundException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_PIN_NOT_FOUND',
      data: user,
    });
  }
}
