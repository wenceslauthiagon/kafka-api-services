import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_VALUE_TYPE')
export class JdpiValueTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Value Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_VALUE_TYPE',
      data,
    });
  }
}
