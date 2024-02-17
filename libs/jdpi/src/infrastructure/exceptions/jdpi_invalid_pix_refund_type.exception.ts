import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INVALID_PIX_REFUND_TYPE')
export class JdpiInvalidPixRefundTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi invalid pix refund type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INVALID_PIX_REFUND_TYPE',
      data,
    });
  }
}
