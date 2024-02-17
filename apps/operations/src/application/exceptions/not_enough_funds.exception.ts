import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WalletAccount } from '@zro/operations/domain';

/**
 * Thrown when user does not have enough founds to execute desired operation.
 */

@Exception(ExceptionTypes.USER, 'NOT_ENOUGH_FUNDS')
export class NotEnoughFundsException extends DefaultException {
  constructor(walletAccount: WalletAccount, value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOT_ENOUGH_FUNDS',
      data: { walletAccount, value },
    });
  }

  getWalletAccount(): WalletAccount {
    return this.data.walletAccount;
  }
}
