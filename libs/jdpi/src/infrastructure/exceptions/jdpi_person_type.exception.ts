import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PERSON_TYPE')
export class JdpiPersonTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Person Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PERSON_TYPE',
      data,
    });
  }
}
