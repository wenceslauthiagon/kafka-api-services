import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WarningTransaction } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'WARNING_TRANSACTION_ALREADY_EXISTS')
export class WarningTransactionAlreadyExistsException extends DefaultException {
  constructor(warningTransaction: Partial<WarningTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WARNING_TRANSACTION_ALREADY_EXISTS',
      data: warningTransaction,
    });
  }
}
