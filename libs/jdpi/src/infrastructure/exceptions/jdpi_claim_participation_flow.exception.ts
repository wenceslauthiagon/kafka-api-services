import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_CLAIM_PARTICIPATION_FLOW')
export class JdpiClaimParticipationFlowException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Claim Participation Flow error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_CLAIM_PARTICIPATION_FLOW',
      data,
    });
  }
}
