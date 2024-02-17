import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankingTed } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANKING_TED_NOT_FOUND')
export class BankingTedNotFoundException extends DefaultException {
  constructor(data: Partial<BankingTed>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_NOT_FOUND',
      data,
    });
  }
}
