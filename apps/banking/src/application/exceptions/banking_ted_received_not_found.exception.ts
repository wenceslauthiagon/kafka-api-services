import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankingTedReceived } from '@zro/banking/domain';

@Exception(ExceptionTypes.USER, 'BANKING_TED_RECEIVED_NOT_FOUND')
export class BankingTedReceivedNotFoundException extends DefaultException {
  constructor(data: Partial<BankingTedReceived>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_RECEIVED_NOT_FOUND',
      data,
    });
  }
}
