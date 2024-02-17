import { DefaultException, ExceptionTypes } from '@zro/common';

export class ForbiddenException extends DefaultException {
  constructor(data?: any) {
    super({
      message: 'Forbidden',
      type: ExceptionTypes.FORBIDDEN,
      code: 'FORBIDDEN',
      data,
    });
  }
}
