import { WarningTransactionStatus } from '@zro/compliance/domain';

export interface UpdateWarningTransactionStatusToClosedIssueRequest {
  issueId: number;
  status: WarningTransactionStatus;
}

export interface UpdateWarningTransactionStatusToClosedIssueGateway {
  updateWarningTransactionStatusToClosed(
    request: UpdateWarningTransactionStatusToClosedIssueRequest,
  ): Promise<void>;
}
