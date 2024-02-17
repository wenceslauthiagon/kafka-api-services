import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PAYMENT_VALUE_IS_NOT_POSITIVE')
export class PaymentValueIsNotPositiveException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_VALUE_IS_NOT_POSITIVE',
      data,
    });
  }
}
