import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankingContact } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANKING_CONTACT_NOT_FOUND')
export class BankingContactNotFoundException extends DefaultException {
  constructor(data: Partial<BankingContact>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_CONTACT_NOT_FOUND',
      data,
    });
  }
}
