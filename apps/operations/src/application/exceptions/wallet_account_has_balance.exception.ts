import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletAccount } from '@zro/operations/domain';

/**
 * Thrown when wallet account balance has some value.
 */
@Exception(ExceptionTypes.USER, 'WALLET_ACCOUNT_HAS_BALANCE')
export class WalletAccountHasBalanceException extends DefaultException {
  constructor(data: Partial<WalletAccount>[]) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_ACCOUNT_HAS_BALANCE',
      data,
    });
  }
}
