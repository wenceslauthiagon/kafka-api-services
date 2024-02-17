import { RefundStatusEnum } from '@zro/nupay/domain/entities/refund_status.enum';
import { Amount } from './commons/amount';
import { RefundError } from './commons/refund_error';

export class NuPayGetRefundStatusResponse {
  transactionRefundId: string;
  pspReferenceId: string;
  refundId: string;
  status: RefundStatusEnum;
  dueDate: string;
  amount: Amount;
  error?: RefundError;
  source?: string;
  requestedBy?: string;
}
