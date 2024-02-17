import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Signup } from '@zro/signup/domain';

@Exception(ExceptionTypes.USER, 'SIGNUP_NOT_FOUND')
export class SignupNotFoundException extends DefaultException {
  constructor(signup: Partial<Signup>) {
    super({
      type: ExceptionTypes.USER,
      code: 'SIGNUP_NOT_FOUND',
      data: signup,
    });
  }
}
