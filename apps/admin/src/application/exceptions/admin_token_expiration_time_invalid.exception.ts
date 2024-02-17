import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Admin } from '@zro/admin/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_TOKEN_EXPIRATION_TIME_INVALID')
export class AdminTokenExpirationTimeInvalidException extends DefaultException {
  constructor(admin: Partial<Admin>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_TOKEN_EXPIRATION_TIME_INVALID',
      data: admin,
    });
  }
}
