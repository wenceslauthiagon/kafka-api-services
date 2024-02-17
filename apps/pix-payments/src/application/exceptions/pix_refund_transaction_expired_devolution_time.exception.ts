import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixRefundTransaction } from '@zro/pix-payments/domain';

@Exception(
  ExceptionTypes.USER,
  'PIX_REFUND_TRANSACTION_EXPIRED_DEVOLUTION_TIME_EXCEPTION',
)
export class PixRefundTransactionExpiredDevolutionTimeException extends DefaultException {
  constructor(data: Partial<PixRefundTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_REFUND_TRANSACTION_EXPIRED_DEVOLUTION_TIME_EXCEPTION',
      data,
    });
  }
}
