import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when wallet is not root for this user.
 */
@Exception(ExceptionTypes.USER, 'WALLET_USER_NOT_ROOT')
export class WalletUserNotRootException extends DefaultException {
  constructor(data: Partial<Wallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_USER_NOT_ROOT',
      data,
    });
  }
}
