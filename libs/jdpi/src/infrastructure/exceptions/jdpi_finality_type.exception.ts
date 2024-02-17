import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_FINALITY_TYPE')
export class JdpiFinalityTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Finality Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_FINALITY_TYPE',
      data,
    });
  }
}
