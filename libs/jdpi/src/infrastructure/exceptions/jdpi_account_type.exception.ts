import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_ACCOUNT_TYPE')
export class JdpiAccountTypeException extends DefaultException {
  constructor(data?: string | number) {
    super({
      message: 'Jdpi Account Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_ACCOUNT_TYPE',
      data,
    });
  }
}
