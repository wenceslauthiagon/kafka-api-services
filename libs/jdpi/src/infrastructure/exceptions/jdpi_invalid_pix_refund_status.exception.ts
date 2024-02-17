import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INVALID_PIX_REFUND_STATUS')
export class JdpiInvalidPixRefundStatusException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi invalid pix refund status error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INVALID_PIX_REFUND_STATUS',
      data,
    });
  }
}
