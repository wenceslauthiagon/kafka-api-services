import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { User } from '@zro/users/domain';

const code = 'USER_FORGOT_PIN';

@Exception(ExceptionTypes.USER, code)
export class UserForgotPinException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code,
      data: user,
    });
  }
}
