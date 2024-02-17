import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankingAccountContact } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANKING_ACCOUNT_CONTACT_NOT_FOUND')
export class BankingAccountContactNotFoundException extends DefaultException {
  constructor(data: Partial<BankingAccountContact>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_ACCOUNT_CONTACT_NOT_FOUND',
      data,
    });
  }
}
