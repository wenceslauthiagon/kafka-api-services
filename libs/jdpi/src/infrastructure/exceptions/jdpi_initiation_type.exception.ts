import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_INITIATION_TYPE')
export class JdpiInitiationTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Initiation Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_INITIATION_TYPE',
      data,
    });
  }
}
