import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'NOTIFY_INVALID_TRANSACTION_TYPE')
export class NotifyInvalidtransactionTypeException extends DefaultException {
  constructor(transactionType: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_INVALID_TRANSACTION_TYPE',
      data: { transactionType },
    });
  }
}
