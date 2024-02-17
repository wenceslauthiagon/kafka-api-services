import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'PIX_KEY_INVALID_STATE')
export class PixKeyInvalidStateException extends DefaultException {
  constructor(pixKey: Partial<PixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_INVALID_STATE',
      data: pixKey,
    });
  }
}
