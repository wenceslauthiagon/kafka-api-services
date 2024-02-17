import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKeyDecodeLimit } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.SYSTEM, 'PIX_KEY_DECODE_LIMIT_NOT_FOUND')
export class PixKeyDecodeLimitNotFoundException extends DefaultException {
  constructor(data: Partial<PixKeyDecodeLimit>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PIX_KEY_DECODE_LIMIT_NOT_FOUND',
      data,
    });
  }
}
