import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixFraudDetection } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_FRAUD_DETECTION_INVALID_STATE')
export class PixFraudDetectionInvalidStateException extends DefaultException {
  constructor(data: Partial<PixFraudDetection>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_FRAUD_DETECTION_INVALID_STATE',
      data,
    });
  }
}
