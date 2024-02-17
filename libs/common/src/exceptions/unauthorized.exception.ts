import { DefaultException, ExceptionTypes } from '@zro/common';

export class UnauthorizedException extends DefaultException {
  constructor(data?: any) {
    super({
      message: 'Unauthorized request',
      type: ExceptionTypes.UNAUTHORIZED,
      code: 'UNAUTHORIZED',
      data,
    });
  }
}
