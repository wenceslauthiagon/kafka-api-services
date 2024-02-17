import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyClaim } from '@zro/api-topazio/domain';

@Exception(ExceptionTypes.USER, 'NOTIFY_CLAIM_INVALID_FLOW')
export class NotifyClaimInvalidFlowException extends DefaultException {
  constructor(claim: Partial<NotifyClaim>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_CLAIM_INVALID_FLOW',
      data: claim,
    });
  }
}
