import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Admin } from '@zro/admin/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_NOT_FOUND')
export class AdminNotFoundException extends DefaultException {
  constructor(admin: Partial<Admin>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_NOT_FOUND',
      data: admin,
    });
  }
}
