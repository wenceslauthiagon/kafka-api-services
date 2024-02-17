import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'TRANSACTION_ID_NOT_FOUND')
export class TransactionIdNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_ID_NOT_FOUND',
      data: { id },
    });
  }
}
