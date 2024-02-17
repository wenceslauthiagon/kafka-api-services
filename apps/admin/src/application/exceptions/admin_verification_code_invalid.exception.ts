import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Admin } from '@zro/admin/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_VERIFICATION_CODE_INVALID')
export class AdminVerificationCodeInvalidException extends DefaultException {
  constructor(admin: Partial<Admin>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_VERIFICATION_CODE_INVALID',
      data: admin,
    });
  }
}
