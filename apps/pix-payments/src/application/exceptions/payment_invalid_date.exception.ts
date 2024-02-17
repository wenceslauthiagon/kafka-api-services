import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PAYMENT_INVALID_DATE')
export class PaymentInvalidDateException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_INVALID_DATE',
      data,
    });
  }
}
