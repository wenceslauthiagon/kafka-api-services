import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { TransactionType } from '@zro/operations/domain';

/**
 * Thrown when transaction type was not found in database.
 */
@Exception(ExceptionTypes.USER, 'TRANSACTION_TYPE_NOT_FOUND')
export class TransactionTypeNotFoundException extends DefaultException {
  constructor(transactionType: Partial<TransactionType>) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_TYPE_NOT_FOUND',
      data: transactionType,
    });
  }
}
