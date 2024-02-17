import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'NOTIFY_INVALID_STATUS')
export class NotifyInvalidStatusException extends DefaultException {
  constructor(status: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_INVALID_STATUS',
      data: { status },
    });
  }
}
