import { CancelPaymentCodeEnum } from '@zro/nupay/domain/entities/cancel_payment_code.enum';
import { CancelPaymentStatusEnum } from '@zro/nupay/domain/entities/cancel_payment_status.enum';

export class NuPayCancelPaymentResponse {
  pspReferenceId: string;
  referenceId: string;
  status: CancelPaymentStatusEnum;
  code?: CancelPaymentCodeEnum;
  message?: string;
}
