import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when maximum number of wallets created.
 */
@Exception(ExceptionTypes.USER, 'WALLET_MAX_NUMBER')
export class WalletMaxNumberException extends DefaultException {
  constructor(data: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'WALLET_MAX_NUMBER',
      data,
    });
  }
}
