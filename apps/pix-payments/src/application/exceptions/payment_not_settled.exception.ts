import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PAYMENT_NOT_SETTLED')
export class PaymentNotSettledException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_NOT_SETTLED',
      data,
    });
  }
}
