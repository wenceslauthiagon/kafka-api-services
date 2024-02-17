import { PixInfractionStatus } from '@zro/pix-payments/domain';

export interface UpdateInfractionStatusIssueInfractionRequest {
  issueId: number;
  status: PixInfractionStatus;
}

export interface UpdateInfractionStatusIssueInfractionGateway {
  updateInfractionStatus(
    request: UpdateInfractionStatusIssueInfractionRequest,
  ): Promise<void>;
}
