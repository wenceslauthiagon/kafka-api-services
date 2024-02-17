import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INVALID_PIX_REFUND_REJECTION_REASON')
export class JdpiInvalidPixRefundRejectionReasonException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi invalid pix refund rejection reason error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INVALID_PIX_REFUND_REJECTION_REASON',
      data,
    });
  }
}
