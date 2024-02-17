import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CryptoMarket, OrderSide } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_REMITTANCE_AMOUNT_UNDERFLOW')
export class CryptoRemittanceAmountUnderflowException extends DefaultException {
  constructor(amount: number, market: CryptoMarket, side: OrderSide) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REMITTANCE_AMOUNT_UNDERFLOW',
      data: { amount, market, side },
    });
  }
}
