import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PAYMENT_INVALID_STATE')
export class PaymentInvalidStateException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_INVALID_STATE',
      data,
    });
  }
}
