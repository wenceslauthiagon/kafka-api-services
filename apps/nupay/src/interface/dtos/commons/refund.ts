import { RefundStatusEnum } from 'apps/nupay/src/domain';
import { Amount } from './amount';

export class Refund {
  refundId: string;
  status: RefundStatusEnum;
  dueDate: any;
  transactionRefundId: string;
  amount: Amount;
}
