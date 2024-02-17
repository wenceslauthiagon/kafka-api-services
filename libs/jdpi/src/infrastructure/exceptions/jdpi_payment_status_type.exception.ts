import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PAYMENT_STATUS_TYPE')
export class JdpiPaymentStatusTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Payment Status Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PAYMENT_STATUS_TYPE',
      data,
    });
  }
}
