import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Signup } from '@zro/signup/domain';

@Exception(ExceptionTypes.USER, 'SIGNUP_EMAIL_ALREADY_IN_USE')
export class SignupEmailAlreadyInUseException extends DefaultException {
  constructor(signup: Partial<Signup>) {
    super({
      type: ExceptionTypes.USER,
      code: 'SIGNUP_EMAIL_ALREADY_IN_USE',
      data: signup,
    });
  }
}
