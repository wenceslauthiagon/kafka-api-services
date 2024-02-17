import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';

@Exception(ExceptionTypes.USER, 'DECODED_PIX_KEY_OWNED_BY_USER')
export class DecodedPixKeyOwnedByUserException extends DefaultException {
  constructor(user: User, pixKey: PixKey) {
    super({
      type: ExceptionTypes.USER,
      code: 'DECODED_PIX_KEY_OWNED_BY_USER',
      data: { user, pixKey },
    });
  }
}
