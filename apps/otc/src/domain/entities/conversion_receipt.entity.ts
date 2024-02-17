import { ReceiptPortugueseTranslation } from '@zro/common';
import { Operation, PaymentData, Receipt } from '@zro/operations/domain';

export type ConversionReceipt = Receipt;

export class ConversionReceiptEntity implements ConversionReceipt {
  paymentData: PaymentData;
  paymentTitle: string = ReceiptPortugueseTranslation.cov;
  operationId: Operation['id'];
  isScheduled = false;
  activeDevolution = false;

  constructor(props: Partial<ConversionReceipt>) {
    Object.assign(this, props);
  }
}
