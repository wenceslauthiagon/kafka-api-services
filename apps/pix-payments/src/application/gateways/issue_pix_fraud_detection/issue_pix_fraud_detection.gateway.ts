import { UpdatePixFraudDetectionIssueGateway } from './update_issue_pix_fraud_detection.gateway';
import { CreatePixFraudDetectionIssueGateway } from './create_issue_pix_fraud_detection.gateway';

export type IssuePixFraudDetectionGateway =
  CreatePixFraudDetectionIssueGateway & UpdatePixFraudDetectionIssueGateway;
