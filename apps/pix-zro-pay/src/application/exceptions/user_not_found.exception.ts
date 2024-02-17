import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'USER_NOT_FOUND')
export class UserNotFoundException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_NOT_FOUND',
      data: user,
    });
  }
}
