import { Amount } from './commons/amount';

export class NuPayCreateRefundRequest {
  transactionRefundId: string;
  amount: Amount;
  notes?: string;
}
