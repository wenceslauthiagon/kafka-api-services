import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_AGENT_MODALITY_TYPE')
export class JdpiAgentModalityTypeException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Jdpi Agent Modality Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_AGENT_MODALITY_TYPE',
      data,
    });
  }
}
