import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'WALLETS_NOT_FOUND_EXCEPTION')
export class WalletsNotFoundException extends DefaultException {
  constructor(user: Partial<User>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLETS_NOT_FOUND_EXCEPTION',
      data: user,
    });
  }
}
