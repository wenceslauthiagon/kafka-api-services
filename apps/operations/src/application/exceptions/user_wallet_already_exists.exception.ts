import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserWallet } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'USER_WALLET_ALREADY_EXISTS')
export class UserWalletAlreadyExistsException extends DefaultException {
  constructor(userWallet: Partial<UserWallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_WALLET_ALREADY_EXISTS',
      data: { userWallet },
    });
  }
}
