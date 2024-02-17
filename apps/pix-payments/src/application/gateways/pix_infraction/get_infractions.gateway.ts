import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  PixInfractionType,
  PixInfractionStatus,
  PixInfractionReport,
  PixInfractionAnalysisResultType,
} from '@zro/pix-payments/domain';

export interface GetInfractionPixInfractionPspResponse {
  infractionId: string;
  operationTransactionId?: string;
  ispb?: string;
  endToEndId?: string;
  infractionType: PixInfractionType;
  reportedBy?: PixInfractionReport;
  reportDetails?: string;
  status: PixInfractionStatus;
  debitedParticipant?: string;
  creditedParticipant?: string;
  creationDate?: Date;
  lastChangeDate?: Date;
  analysisResult?: PixInfractionAnalysisResultType;
  analysisDetails?: string;
  isReporter?: boolean;
  closingDate?: Date;
  cancellationDate?: Date;
  state?: NotifyStateType;
}

export interface GetInfractionPixInfractionPspRequest {
  startCreationDate: Date;
  endCreationDate: Date;
}

export interface GetInfractionPixInfractionPspGateway {
  getInfractions(
    request: GetInfractionPixInfractionPspRequest,
  ): Promise<GetInfractionPixInfractionPspResponse[]>;
}
