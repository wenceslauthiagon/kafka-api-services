import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefundDevolution } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_REFUND_DEVOLUTION_AMOUNT_OVERFLOW')
export class PixRefundDevolutionAmountOverflowException extends DefaultException {
  constructor(data: Partial<PixRefundDevolution>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_REFUND_DEVOLUTION_AMOUNT_OVERFLOW',
      data,
    });
  }
}
