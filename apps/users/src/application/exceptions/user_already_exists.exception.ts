import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_ALREADY_EXISTS')
export class UserAlreadyExistsException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_ALREADY_EXISTS',
      data: user,
    });
  }
}
