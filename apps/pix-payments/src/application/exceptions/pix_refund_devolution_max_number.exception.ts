import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_REFUND_DEVOLUTION_MAX_NUMBER')
export class PixRefundDevolutionMaxNumberException extends DefaultException {
  constructor(quantity: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_REFUND_DEVOLUTION_MAX_NUMBER',
      data: quantity,
    });
  }
}
