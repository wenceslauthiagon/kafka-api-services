import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_RESULT_TYPE')
export class JdpiResultTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Result Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_RESULT_TYPE',
      data,
    });
  }
}
