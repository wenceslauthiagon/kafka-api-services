import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CRYPTO_TRANSACTIONS_NOT_FOUND')
export class CryptoTransactionsNotFoundException extends DefaultException {
  constructor() {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_TRANSACTIONS_NOT_FOUND',
    });
  }
}
