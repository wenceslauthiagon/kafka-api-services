import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when bell notification template tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'BELL_NOTIFICATION_NOT_FOUND')
export class BellNotificationNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'BELL_NOTIFICATION_NOT_FOUND',
      data: { id },
    });
  }
}
