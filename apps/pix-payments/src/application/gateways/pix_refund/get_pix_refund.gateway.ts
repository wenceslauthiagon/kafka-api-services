import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
  PixRefundType,
} from '@zro/pix-payments/domain';

export interface GetPixRefundPspRequest {
  status: PixRefundStatus;
}

export interface GetPixRefundPspResponse {
  transactionId?: string;
  transactionEndToEndId?: string;
  solicitationId: string;
  contested?: boolean;
  endToEndId: string;
  refundAmount: number;
  refundDetails?: string;
  refundReason?: PixRefundReason;
  refundType?: PixRefundType;
  requesterIspb?: string;
  responderIspb?: string;
  status: PixRefundStatus;
  creationDate?: Date;
  devolutionId?: string;
  infractionId?: string;
  lastChangeDate?: Date;
  refundAnalisysDetails?: string;
  refundAnalisysResult?: string;
  refundRejectionReason?: PixRefundRejectionReason;
}

export interface GetPixRefundPspGateway {
  getRefundRequest(
    request: GetPixRefundPspRequest,
  ): Promise<GetPixRefundPspResponse[]>;
}
