import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'NOTIFY_PIX_PAYMENT_NOT_FOUND')
export class NotifyPixPaymentNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_PAYMENT_NOT_FOUND',
      data: { id },
    });
  }
}
