import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PAYMENT_PRIORITY_LEVEL_TYPE')
export class JdpiPaymentPriorityLevelTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Payment Priority Level Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PAYMENT_PRIORITY_LEVEL_TYPE',
      data,
    });
  }
}
