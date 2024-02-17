import {
  PixInfractionType,
  PixInfractionStatus,
  PixInfractionReport,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface CreateInfractionPixInfractionPspRequest {
  operationTransactionId: string;
  operationTransactionEndToEndId: string;
  infractionType: PixInfractionType;
  reportDetails: string;
  ispb: string;
  personType: PersonType;
  document: string;
  ispbDebitedParticipant: string;
  ispbCreditedParticipant: string;
  reportBy: PixInfractionReport;
  createdAt: Date;
  branch: string;
  accountNumber: string;
}

export interface CreateInfractionPixInfractionPspResponse {
  infractionId: string;
  infractionType: PixInfractionType;
  reportedBy: string;
  status: PixInfractionStatus;
  debitedParticipant: string;
  creditedParticipant: string;
  reportDetails: string;
  operationTransactionId: string;
}

export interface CreateInfractionPixInfractionPspGateway {
  createInfraction(
    request: CreateInfractionPixInfractionPspRequest,
  ): Promise<CreateInfractionPixInfractionPspResponse>;
}
