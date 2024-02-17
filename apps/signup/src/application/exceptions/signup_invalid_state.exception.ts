import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { Signup } from '@zro/signup/domain';

@Exception(ExceptionTypes.USER, 'SIGNUP_INVALID_STATE')
export class SignupInvalidStateException extends DefaultException {
  constructor(signup: Partial<Signup>) {
    super({
      type: ExceptionTypes.USER,
      code: 'SIGNUP_INVALID_STATE',
      data: signup,
    });
  }
}
