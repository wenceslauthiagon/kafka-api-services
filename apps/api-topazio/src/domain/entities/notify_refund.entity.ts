import { Domain } from '@zro/common';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import { NotifyStateType } from './types.entity';

export interface NotifyRefund extends Domain<string> {
  solicitationId: string;
  transactionId: string;
  contested?: boolean;
  endToEndId: string;
  refundAmount: number;
  refundDetails?: string;
  refundReason?: PixRefundReason;
  refundRejectionReason?: PixRefundRejectionReason;
  refundAnalisysDetails?: string;
  refundAnalisysResult?: string;
  refundType?: string;
  requesterIspb?: string;
  responderIspb?: string;
  status: PixRefundStatus;
  creationDate?: Date;
  infractionId?: string;
  devolutionId?: string;
  lastChangeDate?: Date;
  state: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyRefundEntity implements NotifyRefund {
  id: string;
  solicitationId: string;
  transactionId: string;
  contested?: boolean;
  endToEndId: string;
  refundAmount: number;
  refundDetails?: string;
  refundReason?: PixRefundReason;
  refundRejectionReason?: PixRefundRejectionReason;
  refundType?: string;
  refundAnalisysDetails?: string;
  refundAnalisysResult?: string;
  requesterIspb?: string;
  responderIspb?: string;
  status: PixRefundStatus;
  creationDate?: Date;
  infractionId?: string;
  devolutionId?: string;
  lastChangeDate?: Date;
  state: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyRefund>) {
    Object.assign(this, props);
  }
}
