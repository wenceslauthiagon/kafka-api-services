import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_TRANSACTION_TYPE')
export class JdpiTransactionTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Transaction Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_TRANSACTION_TYPE',
      data,
    });
  }
}
