import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedPixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'DECODED_PIX_KEY_NOT_FOUND')
export class DecodedPixKeyNotFoundException extends DefaultException {
  constructor(data: Partial<DecodedPixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'DECODED_PIX_KEY_NOT_FOUND',
      data,
    });
  }
}
