import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INVALID_PIX_REFUND_REASON_TYPE')
export class JdpiInvalidPixRefundReasonTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi invalid pix refund reason type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INVALID_PIX_REFUND_REASON_TYPE',
      data,
    });
  }
}
