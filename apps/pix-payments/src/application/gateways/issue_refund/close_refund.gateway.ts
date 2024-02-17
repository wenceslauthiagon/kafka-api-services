import { PixRefundReason, PixRefundStatus } from '@zro/pix-payments/domain';

export interface CloseRefundIssueRequest {
  issueId: number;
  solicitationPspId: string;
  description: string;
  reason: PixRefundReason;
}

export interface CloseRefundIssueResponse {
  solicitationPspId: string;
  status: PixRefundStatus;
}

export interface CloseRefundIssueGateway {
  closeRefund(
    request: CloseRefundIssueRequest,
  ): Promise<CloseRefundIssueResponse>;
}
