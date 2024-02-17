import { PaymentCodeEnum } from '@zro/nupay/domain/entities/payment_code.enum';
import { Amount } from './commons/amount';
import { Payer } from './commons/payer';
import { Refund } from './commons/refund';
import { PaymentStatusEnum } from '@zro/nupay/domain/entities/payment_status.enum';

export class NuPayPaymentStatusResponse {
  pspReferenceId: string;
  referenceId: string;
  status: PaymentStatusEnum;
  amount: Amount;
  timestamp: string;
  payer: Payer;
  code?: PaymentCodeEnum;
  message?: string;
  paymentMethodType?: string;
  refunds?: Refund[];
  paymentType?: string;
  installmentNumber?: number;
  installmentNumberPurchase?: number;
}
