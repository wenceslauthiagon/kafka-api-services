import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Wallet } from '@zro/operations/domain';

/**
 * Thrown when wallet cannot be deleted.
 */
@Exception(ExceptionTypes.USER, 'WALLET_CANNOT_BE_DELETED')
export class WalletCannotBeDeletedException extends DefaultException {
  constructor(data: Partial<Wallet>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_CANNOT_BE_DELETED',
      data,
    });
  }
}
