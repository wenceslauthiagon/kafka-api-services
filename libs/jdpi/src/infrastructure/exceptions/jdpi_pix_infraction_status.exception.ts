import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PIX_INFRACTION_STATUS')
export class JdpiPixInfractionStatusException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Pix infraction status',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PIX_INFRACTION_STATUS',
      data,
    });
  }
}
