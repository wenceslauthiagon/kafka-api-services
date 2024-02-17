import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when email template tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'EMAIL_TEMPLATE_TAG_NOT_FOUND')
export class EmailTemplateTagNotFoundException extends DefaultException {
  constructor(tag: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'EMAIL_TEMPLATE_TAG_NOT_FOUND',
      data: { tag },
    });
  }
}
