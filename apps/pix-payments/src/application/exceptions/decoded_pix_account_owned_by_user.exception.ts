import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedPixAccount } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'DECODED_PIX_ACCOUNT_OWNED_BY_USER')
export class DecodedPixAccountOwnedByUserException extends DefaultException {
  constructor(data: Partial<DecodedPixAccount>) {
    super({
      type: ExceptionTypes.USER,
      code: 'DECODED_PIX_ACCOUNT_OWNED_BY_USER',
      data,
    });
  }
}
