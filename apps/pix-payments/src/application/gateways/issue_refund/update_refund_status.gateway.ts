import { PixRefundStatus } from '@zro/pix-payments/domain';

export interface UpdateRefundStatusIssueRefundRequest {
  issueId: number;
  status: PixRefundStatus;
}

export interface UpdateRefundStatusIssueRefundGateway {
  updateRefundStatus(
    request: UpdateRefundStatusIssueRefundRequest,
  ): Promise<void>;
}
