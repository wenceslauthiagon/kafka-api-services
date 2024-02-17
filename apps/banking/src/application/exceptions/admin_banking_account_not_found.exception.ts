import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { AdminBankingAccount } from '@zro/banking/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_BANKING_ACCOUNT_NOT_FOUND')
export class AdminBankingAccountNotFoundException extends DefaultException {
  constructor(data: Partial<AdminBankingAccount>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_BANKING_ACCOUNT_NOT_FOUND',
      data,
    });
  }
}
