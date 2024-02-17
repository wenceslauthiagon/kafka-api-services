import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when sms template tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'SMS_TEMPLATE_TAG_NOT_FOUND')
export class SmsTemplateTagNotFoundException extends DefaultException {
  constructor(tag: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'SMS_TEMPLATE_TAG_NOT_FOUND',
      data: { tag },
    });
  }
}
