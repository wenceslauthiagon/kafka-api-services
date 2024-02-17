import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PIX_INFRACTION_TYPE')
export class JdpiPixInfractionTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Pix Infraction Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PIX_INFRACTION_TYPE',
      data,
    });
  }
}
