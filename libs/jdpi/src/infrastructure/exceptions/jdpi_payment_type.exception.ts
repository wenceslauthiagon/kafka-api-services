import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PAYMENT_TYPE')
export class JdpiPaymentTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Payment Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PAYMENT_TYPE',
      data,
    });
  }
}
