import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefund } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.ADMIN, 'PIX_REFUND_NOT_FOUND')
export class PixRefundNotFoundException extends DefaultException {
  constructor(data: Partial<PixRefund>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_REFUND_NOT_FOUND',
      data,
    });
  }
}
