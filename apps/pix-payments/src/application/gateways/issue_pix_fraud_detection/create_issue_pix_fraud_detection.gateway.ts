import { PixFraudDetectionType } from '@zro/pix-payments/domain';

export type CreatePixFraudDetectionIssueRequest = {
  externalId: string;
  document: string;
  fraudType: PixFraudDetectionType;
  key?: string;
};

export interface CreatePixFraudDetectionIssueResponse {
  issueId: number;
}

export interface CreatePixFraudDetectionIssueGateway {
  createPixFraudDetectionIssue(
    request: CreatePixFraudDetectionIssueRequest,
  ): Promise<CreatePixFraudDetectionIssueResponse>;
}
