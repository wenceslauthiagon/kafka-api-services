import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PAYMENT_NOT_FOUND')
export class PaymentNotFoundException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_NOT_FOUND',
      data,
    });
  }
}
