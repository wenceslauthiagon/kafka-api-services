import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Admin } from '@zro/admin/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_PASSWORD_INVALID')
export class AdminPasswordInvalidException extends DefaultException {
  constructor(admin: Partial<Admin>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_PASSWORD_INVALID',
      data: admin,
    });
  }
}
