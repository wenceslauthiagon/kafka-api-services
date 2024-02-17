import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WarningTransaction } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'WARNING_TRANSACTION_NOT_FOUND')
export class WarningTransactionNotFoundException extends DefaultException {
  constructor(warningTransaction: Partial<WarningTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WARNING_TRANSACTION_NOT_FOUND',
      data: warningTransaction,
    });
  }
}
