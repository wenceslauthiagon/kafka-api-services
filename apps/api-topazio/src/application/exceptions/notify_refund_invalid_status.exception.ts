import { DefaultException, ExceptionTypes } from '@zro/common';

export class InvalidNotifyRefundStatusException extends DefaultException {
  constructor(refundStatus: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'INVALID_NOTIFY_REFUND_STATUS',
      data: refundStatus,
    });
  }
}
