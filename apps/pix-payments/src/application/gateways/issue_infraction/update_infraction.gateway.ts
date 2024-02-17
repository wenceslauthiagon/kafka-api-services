import { Operation } from '@zro/operations/domain';
import {
  PixInfractionType,
  PixInfractionAnalysisResultType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';

export interface UpdateInfractionIssueInfractionRequest {
  issueId: number;
  infractionPspId?: string;
  operation?: Operation;
  description?: string;
  summary?: string;
  infractionType?: PixInfractionType;
  analysisResult?: PixInfractionAnalysisResultType;
  ispbDebitedParticipant?: string;
  ispbCreditedParticipant?: string;
  reportBy?: PixInfractionReport;
  endToEndId?: string;
  dueDate?: string;
}

export interface UpdateInfractionIssueInfractionGateway {
  updateInfraction(
    request: UpdateInfractionIssueInfractionRequest,
  ): Promise<void>;
}
