import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankingTed } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANKING_TED_INVALID_CONFIRMATION')
export class BankingTedInvalidConfirmationException extends DefaultException {
  constructor(data: Partial<BankingTed>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_INVALID_CONFIRMATION',
      data,
    });
  }
}
