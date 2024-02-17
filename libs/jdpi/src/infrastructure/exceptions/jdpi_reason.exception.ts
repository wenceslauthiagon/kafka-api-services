import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_REASON_TYPE')
export class JdpiReasonException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Reason Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_REASON_TYPE',
      data,
    });
  }
}
