import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefund } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.ADMIN, 'PIX_REFUND_LIMIT_DATE')
export class PixRefundLimitDateException extends DefaultException {
  constructor(data: Partial<PixRefund>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_REFUND_LIMIT_DATE',
      data,
    });
  }
}
