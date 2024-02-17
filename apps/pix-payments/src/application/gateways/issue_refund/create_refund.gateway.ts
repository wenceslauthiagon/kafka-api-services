import { Operation } from '@zro/operations/domain';
import { PixRefundReason } from '@zro/pix-payments/domain';

export interface CreateRefundIssueRequest {
  clientName: string;
  endToEndId: string;
  amount: number;
  description: string;
  reason: PixRefundReason;
  operation: Operation;
}
export interface CreateRefundIssueResponse {
  issueId: number;
}

export interface CreateRefundIssueGateway {
  createRefund(
    request: CreateRefundIssueRequest,
  ): Promise<CreateRefundIssueResponse>;
}
