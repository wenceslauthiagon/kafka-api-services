import { NuPayCreateRefundRequest } from '@zro/nupay/interface/dtos/nupay_create_refund_request';
import { NuPayCreateRefundResponse } from '@zro/nupay/interface/dtos/nupay_create_refund_response';
import { NuPayGetRefundStatusResponse } from '@zro/nupay/interface/dtos/nupay_get_refund_status_response';

export interface IRefundService {
  create(
    pspReferenceId: string,
    request: NuPayCreateRefundRequest,
  ): Promise<NuPayCreateRefundResponse>;
  getStatus(
    pspReferenceId: string,
    refundId: string,
  ): Promise<NuPayGetRefundStatusResponse>;
}
