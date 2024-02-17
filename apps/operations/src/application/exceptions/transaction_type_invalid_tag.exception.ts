import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { TransactionType } from '@zro/operations/domain';

@Exception(ExceptionTypes.USER, 'TRANSACTION_TYPE_INVALID_TAG')
export class TransactionTypeInvalidTagException extends DefaultException {
  constructor(transactionType: Partial<TransactionType>) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_TYPE_INVALID_TAG',
      data: transactionType,
    });
  }
}
