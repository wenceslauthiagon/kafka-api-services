import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_PIX_INFRACTION_ANALYSIS_RESULT_TYPE')
export class JdpiPixInfractionaAnalysisResultTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Pix infraction analysis result type',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_PIX_INFRACTION_ANALYSIS_RESULT_TYPE',
      data,
    });
  }
}
