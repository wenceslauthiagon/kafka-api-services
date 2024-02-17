import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_OPERATION_TYPE')
export class JdpiOperationTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Operation Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_OPERATION_TYPE',
      data,
    });
  }
}
