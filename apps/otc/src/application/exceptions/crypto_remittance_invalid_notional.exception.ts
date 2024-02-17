import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoMarket } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_INVALID_NOTIONAL')
export class CryptoRemittanceInvalidNotionalException extends DefaultException {
  constructor(notional: number, market: CryptoMarket) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_INVALID_NOTIONAL',
      data: { notional, market },
    });
  }
}
