import { Domain } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';
import { NotifyStateType } from './types.entity';

export interface NotifyInfraction extends Domain<string> {
  infractionId: string;
  operationTransactionId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyInfractionEntity implements NotifyInfraction {
  id: string;
  infractionId: string;
  operationTransactionId: string;
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
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyInfraction>) {
    Object.assign(this, props);
  }
}
