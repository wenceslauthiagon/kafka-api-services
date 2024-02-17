import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { TransactionType } from '@zro/operations/domain';

/**
 * Thrown when transaction type tag was not active.
 */
@Exception(ExceptionTypes.USER, 'TRANSACTION_TYPE_NOT_ACTIVE')
export class TransactionTypeNotActiveException extends DefaultException {
  constructor(transactionType: TransactionType) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_TYPE_NOT_ACTIVE',
      data: { transactionType },
    });
  }
}
