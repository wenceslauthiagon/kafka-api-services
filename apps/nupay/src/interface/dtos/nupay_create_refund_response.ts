import { RefundStatusEnum } from '@zro/nupay/domain/entities/refund_status.enum';

export class NuPayCreateRefundResponse {
  pspReferenceId: string;
  status: RefundStatusEnum;
  refundId: string;
  dueDate?: string | null;
}
