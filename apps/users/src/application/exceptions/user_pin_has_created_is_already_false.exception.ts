import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'USER_PIN_HAS_CREATED_IS_ALREADY_FALSE')
export class UserPinHasCreatedIsAlreadyFalseException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_PIN_HAS_CREATED_IS_ALREADY_FALSE',
      data: user,
    });
  }
}
