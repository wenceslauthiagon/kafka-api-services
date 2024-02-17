import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'PIX_KEY_ALREADY_CREATED')
export class PixKeyAlreadyCreatedException extends DefaultException {
  constructor(pixKey: Partial<PixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_ALREADY_CREATED',
      data: pixKey,
    });
  }
}
