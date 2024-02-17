import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_EMAIL_FORMAT')
export class InvalidEmailFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid email format',
      type: ExceptionTypes.USER,
      code: 'INVALID_EMAIL_FORMAT',
      data: { value },
    });
  }
}
