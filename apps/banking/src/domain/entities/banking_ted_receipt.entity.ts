import { ReceiptPortugueseTranslation } from '@zro/common';
import { Operation, PaymentData, Receipt } from '@zro/operations/domain';

export type BankingTedReceipt = Receipt;

export class BankingTedReceiptEntity implements BankingTedReceipt {
  paymentData: PaymentData;
  paymentTitle: string = ReceiptPortugueseTranslation.ted;
  operationId: Operation['id'];
  isScheduled = false;
  activeDevolution = false;

  constructor(props: Partial<BankingTedReceipt>) {
    Object.assign(this, props);
  }
}
