import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PIX_INFRACTION_REPORT')
export class JdpiPixInfractionReportException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Pix infraction report',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PIX_INFRACTION_REPORT',
      data,
    });
  }
}
