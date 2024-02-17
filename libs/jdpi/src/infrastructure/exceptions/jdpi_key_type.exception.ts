import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_KEY_TYPE')
export class JdpiKeyTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Key Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_KEY_TYPE',
      data,
    });
  }
}
