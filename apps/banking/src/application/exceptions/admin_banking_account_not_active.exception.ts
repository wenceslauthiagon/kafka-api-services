import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { AdminBankingAccount } from '@zro/banking/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_BANKING_ACCOUNT_NOT_ACTIVE')
export class AdminBankingAccountNotActiveException extends DefaultException {
  constructor(data: Partial<AdminBankingAccount>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_BANKING_ACCOUNT_NOT_ACTIVE',
      data,
    });
  }
}
