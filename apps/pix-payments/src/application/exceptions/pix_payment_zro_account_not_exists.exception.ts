import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_PAYMENT_ZRO_ACCOUNT_NOT_EXISTS')
export class PixPaymentZroAccountNotExistsException extends DefaultException {
  constructor(data: Partial<Payment>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_PAYMENT_ZRO_ACCOUNT_NOT_EXISTS',
      data,
    });
  }
}
