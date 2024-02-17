import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_STATE_DECODED_PIX_KEY')
export class InvalidStateDecodedPixKeyException extends DefaultException {
  constructor(value: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'INVALID_STATE_DECODED_PIX_KEY',
      data: value,
    });
  }
}
