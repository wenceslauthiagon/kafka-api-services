import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_STATE_NOT_FOUND')
export class PaymentStateNotFoundException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_STATE_NOT_FOUND',
      data,
    });
  }
}
