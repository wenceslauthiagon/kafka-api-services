import { DefaultException, ExceptionTypes } from '@zro/common';

export class InvalidNotifyInfractionStatusException extends DefaultException {
  constructor(infractionStatus: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'INVALID_NOTIFY_INFRACTION_STATUS',
      data: infractionStatus,
    });
  }
}
