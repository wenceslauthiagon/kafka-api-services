import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

export type UpdatePixFraudDetectionIssueRequest = {
  issueId: number;
  status?: PixFraudDetectionStatus;
  externalId?: string;
};

export interface UpdatePixFraudDetectionIssueGateway {
  updatePixFraudDetectionIssue(
    request: UpdatePixFraudDetectionIssueRequest,
  ): Promise<void>;
}
