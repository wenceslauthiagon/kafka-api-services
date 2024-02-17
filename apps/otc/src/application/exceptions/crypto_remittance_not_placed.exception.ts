import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoRemittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_NOT_PLACED')
export class CryptoRemittanceNotPlacedException extends DefaultException {
  constructor(remittance: CryptoRemittance) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_NOT_PLACED',
      data: remittance,
    });
  }
}
