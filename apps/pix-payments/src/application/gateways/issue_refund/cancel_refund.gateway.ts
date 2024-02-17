import {
  PixRefundStatus,
  PixRefundRejectionReason,
} from '@zro/pix-payments/domain';

export interface CancelRefundIssueRequest {
  issueId: number;
  solicitationPspId: string;
  status: PixRefundStatus;
  devolutionEndToEndId: string;
  analisysDetails: string;
  rejectionReason: PixRefundRejectionReason;
}

export interface CancelRefundIssueResponse {
  solicitationPspId: string;
  status: PixRefundStatus;
}

export interface CancelRefundIssueGateway {
  cancelRefund(
    request: CancelRefundIssueRequest,
  ): Promise<CancelRefundIssueResponse>;
}
