import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankTed } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANK_TED_NOT_FOUND')
export class BankTedNotFoundException extends DefaultException {
  constructor(data: Partial<BankTed>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANK_TED_NOT_FOUND',
      data,
    });
  }
}
