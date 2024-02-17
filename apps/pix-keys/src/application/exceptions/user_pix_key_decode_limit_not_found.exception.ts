import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserPixKeyDecodeLimit } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'USER_PIX_KEY_DECODE_LIMIT_NOT_FOUND')
export class UserPixKeyDecodeLimitNotFoundException extends DefaultException {
  constructor(data: Partial<UserPixKeyDecodeLimit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_PIX_KEY_DECODE_LIMIT_NOT_FOUND',
      data,
    });
  }
}
