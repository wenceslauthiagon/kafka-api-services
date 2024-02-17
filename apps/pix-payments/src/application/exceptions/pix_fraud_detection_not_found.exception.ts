import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixFraudDetection } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.ADMIN, 'PIX_FRAUD_DETECTION_NOT_FOUND')
export class PixFraudDetectionNotFoundException extends DefaultException {
  constructor(data: Partial<PixFraudDetection>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'PIX_FRAUD_DETECTION_NOT_FOUND',
      data,
    });
  }
}
