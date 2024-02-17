import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_AUTH')
export class JdpiAuthException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_AUTH',
      data,
    });
  }
}
