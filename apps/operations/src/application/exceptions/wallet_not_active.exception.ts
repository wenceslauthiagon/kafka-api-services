import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when wallet was not active in database.
 */
@Exception(ExceptionTypes.USER, 'WALLET_NOT_ACTIVE')
export class WalletNotActiveException extends DefaultException {
  constructor(data: Partial<Wallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_NOT_ACTIVE',
      data,
    });
  }
}
