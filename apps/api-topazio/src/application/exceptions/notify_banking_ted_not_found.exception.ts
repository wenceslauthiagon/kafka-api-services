import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'NOTIFY_BANKING_TED_NOT_FOUND')
export class NotifyBankingTedNotFoundException extends DefaultException {
  constructor(transactionId: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_BANKING_TED_NOT_FOUND',
      data: { transactionId },
    });
  }
}
