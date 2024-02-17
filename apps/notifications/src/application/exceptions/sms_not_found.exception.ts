import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when sms template tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'SMS_NOT_FOUND')
export class SmsNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'SMS_NOT_FOUND',
      data: { id },
    });
  }
}
