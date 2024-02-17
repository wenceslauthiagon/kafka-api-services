import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedPixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'DECODED_PIX_KEY_INVALID_STATE')
export class DecodedPixKeyInvalidStateException extends DefaultException {
  constructor(data: Partial<DecodedPixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'DECODED_PIX_KEY_INVALID_STATE',
      data,
    });
  }
}
