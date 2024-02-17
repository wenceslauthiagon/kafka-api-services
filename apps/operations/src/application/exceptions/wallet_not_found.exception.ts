import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when wallet account was not found in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_NOT_FOUND')
export class WalletNotFoundException extends DefaultException {
  constructor(data: Partial<Wallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_NOT_FOUND',
      data,
    });
  }
}
