import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletAccount } from '@zro/operations/domain';

/**
 * Thrown when wallet account was not found in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_ACCOUNT_NOT_FOUND')
export class WalletAccountNotFoundException extends DefaultException {
  constructor(data: Partial<WalletAccount>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_ACCOUNT_NOT_FOUND',
      data,
    });
  }
}
