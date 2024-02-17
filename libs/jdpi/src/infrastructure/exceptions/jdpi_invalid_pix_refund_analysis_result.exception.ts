import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INVALID_PIX_REFUND_ANALYSIS_RESULT')
export class JdpiInvalidPixRefundAnalysisResultException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi invalid pix refund analysis result error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INVALID_PIX_REFUND_ANALYSIS_RESULT',
      data,
    });
  }
}
