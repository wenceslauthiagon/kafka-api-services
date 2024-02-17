import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoRemittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_INVALID_STATUS')
export class CryptoRemittanceInvalidStatusException extends DefaultException {
  constructor(remittance: CryptoRemittance) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_INVALID_STATUS',
      data: remittance,
    });
  }
}
