import { NuPayCancelPaymentResponse } from '@zro/nupay/interface/dtos/nupay_cancel_payment_response';
import { NuPayCreatePaymentRequest } from '@zro/nupay/interface/dtos/nupay_create_payment_request';
import { NuPayCreatePaymentResponse } from '@zro/nupay/interface/dtos/nupay_create_payment_response';
import { NuPayPaymentStatusResponse } from '@zro/nupay/interface/dtos/nupay_get_payment_status_response';

export interface IPaymentService {
  create(
    request: NuPayCreatePaymentRequest,
  ): Promise<NuPayCreatePaymentResponse>;
  getStatus(referenceId: string): Promise<NuPayPaymentStatusResponse>;
  cancel(pspReferenceId: string): Promise<NuPayCancelPaymentResponse>;
}
