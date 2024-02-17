import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'PIX_KEY_VERIFICATION_OVERFLOW')
export class PixKeyVerificationOverflowException extends DefaultException {
  constructor(pixKey: Partial<PixKey>, retries: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_VERIFICATION_OVERFLOW',
      data: { pixKey, retries },
    });
  }
}
