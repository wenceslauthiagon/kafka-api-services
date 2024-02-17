import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when transaction type tag was not found in database.
 */
@Exception(ExceptionTypes.USER, 'TRANSACTION_TYPE_TAG_NOT_FOUND')
export class TransactionTypeTagNotFoundException extends DefaultException {
  constructor(tag: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_TYPE_TAG_NOT_FOUND',
      data: { tag },
    });
  }
}
