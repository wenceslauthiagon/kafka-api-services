import { PaymentStatusEnum, PaymentCodeEnum } from 'apps/nupay/src/domain';

export class NuPayCreatePaymentResponse {
  pspReferenceId: string;
  referenceId: string;
  status: PaymentStatusEnum;
  paymentUrl: string;
  paymentMethodType?: string;
  code?: PaymentCodeEnum;
  message?: string;
}
