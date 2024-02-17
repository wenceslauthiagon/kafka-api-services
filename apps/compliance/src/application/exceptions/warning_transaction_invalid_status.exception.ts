import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WarningTransaction } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'WARNING_TRANSACTION_INVALID_STATUS')
export class WarningTransactionInvalidStatusException extends DefaultException {
  constructor(warningTransaction: Partial<WarningTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WARNING_TRANSACTION_INVALID_STATUS',
      data: warningTransaction,
    });
  }
}
