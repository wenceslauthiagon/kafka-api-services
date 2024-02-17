import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_FRAUD_DETECTION_TYPE')
export class JdpiFraudDetectionTypeException extends DefaultException {
  constructor(data?: string | number) {
    super({
      message: 'Jdpi Fraud Detection Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_FRAUD_DETECTION_TYPE',
      data,
    });
  }
}
