import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'PIX_KEY_NOT_FOUND')
export class PixKeyNotFoundException extends DefaultException {
  constructor(pixKey: Partial<PixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_NOT_FOUND',
      data: pixKey,
    });
  }
}
