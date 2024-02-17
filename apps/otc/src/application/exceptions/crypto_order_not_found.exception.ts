import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoOrder } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_ORDER_NOT_FOUND')
export class CryptoOrderNotFoundException extends DefaultException {
  constructor(remittance: Partial<CryptoOrder>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_ORDER_NOT_FOUND',
      data: remittance,
    });
  }
}
