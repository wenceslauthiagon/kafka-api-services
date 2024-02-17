import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when wallet accounst not found.
 */
@Exception(ExceptionTypes.USER, 'WALLET_ACCOUNTS_NOT_FOUND')
export class WalletAccountsNotFoundException extends DefaultException {
  constructor(data: Partial<Wallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_ACCOUNTS_NOT_FOUND',
      data,
    });
  }
}
