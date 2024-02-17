import { CreateRefundIssueGateway } from './create_refund.gateway';
import { CancelRefundIssueGateway } from './cancel_refund.gateway';
import { CloseRefundIssueGateway } from './close_refund.gateway';
import { UpdateRefundStatusIssueRefundGateway } from './update_refund_status.gateway';

export type IssueRefundGateway = CreateRefundIssueGateway &
  CancelRefundIssueGateway &
  CloseRefundIssueGateway &
  UpdateRefundStatusIssueRefundGateway;
