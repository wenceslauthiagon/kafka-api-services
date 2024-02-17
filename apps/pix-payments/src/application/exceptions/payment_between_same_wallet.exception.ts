import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when payment has the same wallet.
 */
@Exception(ExceptionTypes.USER, 'PAYMENT_BETWEEN_SAME_WALLET')
export class PaymentBetweenSameWalletException extends DefaultException {
  constructor(owner: Wallet, beneficiary: Wallet) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_BETWEEN_SAME_WALLET',
      data: { owner, beneficiary },
    });
  }
}
