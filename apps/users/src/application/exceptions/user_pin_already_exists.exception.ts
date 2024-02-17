import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_PIN_ALREADY_EXISTS')
export class UserPinAlreadyExistsException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_PIN_ALREADY_EXISTS',
      data: user,
    });
  }
}
