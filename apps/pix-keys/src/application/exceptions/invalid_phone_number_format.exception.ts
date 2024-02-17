import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_PHONE_NUMBER_FORMAT')
export class InvalidPhoneNumberFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid phone number format',
      type: ExceptionTypes.USER,
      code: 'INVALID_PHONE_NUMBER_FORMAT',
      data: { value },
    });
  }
}
