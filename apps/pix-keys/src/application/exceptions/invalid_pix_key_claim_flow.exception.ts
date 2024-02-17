import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKeyClaim } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.SYSTEM, 'INVALID_PIX_KEY_CLAIM_FLOW')
export class InvalidPixKeyClaimFlowException extends DefaultException {
  constructor(data: Partial<PixKeyClaim>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_PIX_KEY_CLAIM_FLOW',
      data,
    });
  }
}
