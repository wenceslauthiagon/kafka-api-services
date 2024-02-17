import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefundTransaction } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_REFUND_TRANSACTION_ZRO_ACCOUNT_NOT_EXISTS')
export class PixRefundTransactionZroAccountNotExistsException extends DefaultException {
  constructor(data: Partial<PixRefundTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_REFUND_TRANSACTION_ZRO_ACCOUNT_NOT_EXISTS',
      data,
    });
  }
}
