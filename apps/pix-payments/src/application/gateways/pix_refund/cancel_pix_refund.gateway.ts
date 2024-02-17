import {
  PixRefundStatus,
  PixRefundRejectionReason,
} from '@zro/pix-payments/domain';

export interface CancelPixRefundPspRequest {
  solicitationPspId: string;
  status: PixRefundStatus;
  analisysDetails: string;
  rejectionReason: PixRefundRejectionReason;
}

export interface CancelPixRefundPspResponse {
  solicitationPspId: string;
  status: PixRefundStatus;
}

export interface CancelPixRefundPspGateway {
  cancelRefundRequest(
    request: CancelPixRefundPspRequest,
  ): Promise<CancelPixRefundPspResponse>;
}
