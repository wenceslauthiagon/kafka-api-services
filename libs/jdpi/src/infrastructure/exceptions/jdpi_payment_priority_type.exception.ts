import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PAYMENT_PRIORITY_TYPE')
export class JdpiPaymentPriorityTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Payment Priority Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PAYMENT_PRIORITY_TYPE',
      data,
    });
  }
}
