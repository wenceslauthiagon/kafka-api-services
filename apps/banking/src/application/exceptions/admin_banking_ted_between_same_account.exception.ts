import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { AdminBankingTed } from '@zro/banking/domain';

@Exception(ExceptionTypes.ADMIN, 'ADMIN_BANKING_TED_BETWEEN_SAME_ACCOUNT')
export class AdminBankingTedBetweenSameAccountException extends DefaultException {
  constructor(data: Partial<AdminBankingTed>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'ADMIN_BANKING_TED_BETWEEN_SAME_ACCOUNT',
      data,
    });
  }
}
