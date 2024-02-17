import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when email template tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'EMAIL_NOT_FOUND')
export class EmailNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'EMAIL_NOT_FOUND',
      data: { id },
    });
  }
}
