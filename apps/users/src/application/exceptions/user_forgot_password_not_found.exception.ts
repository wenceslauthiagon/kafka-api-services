import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { UserForgotPassword } from '@zro/users/domain';

const code = 'USER_FORGOT_PASSWORD_NOT_FOUND';

@Exception(ExceptionTypes.USER, code)
export class UserForgotPasswordNotFoundException extends DefaultException {
  constructor(user: Partial<UserForgotPassword>) {
    super({
      type: ExceptionTypes.USER,
      code,
      data: user,
    });
  }
}
