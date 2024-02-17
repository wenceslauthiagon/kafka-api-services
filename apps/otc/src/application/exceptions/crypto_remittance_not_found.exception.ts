import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoRemittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_NOT_FOUND')
export class CryptoRemittanceNotFoundException extends DefaultException {
  constructor(remittance: Partial<CryptoRemittance>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_NOT_FOUND',
      data: remittance,
    });
  }
}
