import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKeyClaim } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'PIX_KEY_CLAIM_NOT_FOUND')
export class PixKeyClaimNotFoundException extends DefaultException {
  constructor(data: Partial<PixKeyClaim>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_CLAIM_NOT_FOUND',
      data,
    });
  }
}
