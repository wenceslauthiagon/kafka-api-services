import { Operation } from '@zro/operations/domain';
import { PixInfractionType } from '@zro/pix-payments/domain';

export interface CreateInfractionIssueInfractionRequest {
  clientDocument: string;
  description: string;
  operation: Operation;
  infractionType: PixInfractionType;
}

export interface CreateInfractionIssueInfractionResponse {
  issueId: number;
  key: string;
}

export interface CreateInfractionIssueInfractionGateway {
  createInfraction(
    request: CreateInfractionIssueInfractionRequest,
  ): Promise<CreateInfractionIssueInfractionResponse>;
}
