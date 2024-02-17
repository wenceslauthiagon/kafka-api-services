import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankAccount } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'BANK_ACCOUNT_NOT_FOUND')
export class BankAccountNotFoundException extends DefaultException {
  constructor(data: Partial<BankAccount>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANK_ACCOUNT_NOT_FOUND',
      data,
    });
  }
}
