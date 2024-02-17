import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletAccount } from '@zro/operations/domain';

/**
 * Thrown when wallet account was not active in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_ACCOUNT_NOT_ACTIVE')
export class WalletAccountNotActiveException extends DefaultException {
  constructor(data: Partial<WalletAccount>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_ACCOUNT_NOT_ACTIVE',
      data,
    });
  }
}
