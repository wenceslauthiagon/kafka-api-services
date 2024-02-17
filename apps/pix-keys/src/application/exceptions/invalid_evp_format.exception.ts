import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_EVP_FORMAT')
export class InvalidEvpFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid evp format',
      type: ExceptionTypes.USER,
      code: 'INVALID_EVP_FORMAT',
      data: { value },
    });
  }
}
