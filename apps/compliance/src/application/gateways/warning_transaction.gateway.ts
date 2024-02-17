import {
  CreateWarningTransactionGateway,
  UpdateWarningTransactionStatusToClosedIssueGateway,
} from '@zro/compliance/application';

export type WarningTransactionGateway = CreateWarningTransactionGateway &
  UpdateWarningTransactionStatusToClosedIssueGateway;
