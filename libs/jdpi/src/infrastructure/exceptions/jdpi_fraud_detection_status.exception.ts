import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_FRAUD_DETECTION_STATUS')
export class JdpiFraudDetectionStatusException extends DefaultException {
  constructor(data?: string | number) {
    super({
      message: 'Jdpi Fraud Detection Status error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_FRAUD_DETECTION_STATUS',
      data,
    });
  }
}
