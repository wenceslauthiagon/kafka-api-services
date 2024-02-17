import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefund } from '@zro/pix-payments/domain';
@Exception(ExceptionTypes.ADMIN, 'PIX_REFUND_INVALID_STATE')
export class PixRefundInvalidStateException extends DefaultException {
  constructor(data: Partial<PixRefund>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_REFUND_INVALID_STATE',
      data,
    });
  }
}
