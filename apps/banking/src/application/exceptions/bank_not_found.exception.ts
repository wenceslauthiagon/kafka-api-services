import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Bank } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANK_NOT_FOUND')
export class BankNotFoundException extends DefaultException {
  constructor(data: Partial<Bank>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANK_NOT_FOUND',
      data,
    });
  }
}
