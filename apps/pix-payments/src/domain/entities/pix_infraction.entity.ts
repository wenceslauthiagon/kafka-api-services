import { Domain, Failed } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';

export enum PixInfractionStatus {
  // Both
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CLOSED = 'CLOSED',

  // Topazio
  OPEN = 'OPEN',
  CANCELLED = 'CANCELLED',

  // Jira
  NEW = 'NEW',
  RECEIVED = 'RECEIVED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  OPENED = 'OPENED',
}

export enum PixInfractionState {
  NEW_CONFIRMED = 'NEW_CONFIRMED',
  OPEN_PENDING = 'OPEN_PENDING',
  OPEN_CONFIRMED = 'OPEN_CONFIRMED',
  ACKNOWLEDGED_PENDING = 'ACKNOWLEDGED_PENDING',
  ACKNOWLEDGED_CONFIRMED = 'ACKNOWLEDGED_CONFIRMED',
  IN_ANALYSIS_PENDING = 'IN_ANALYSIS_PENDING',
  IN_ANALYSIS_CONFIRMED = 'IN_ANALYSIS_CONFIRMED',
  CLOSED_PENDING = 'CLOSED_PENDING',
  CLOSED_CONFIRMED = 'CLOSED_CONFIRMED',
  RECEIVE_PENDING = 'RECEIVE_PENDING',
  RECEIVE_CONFIRMED = 'RECEIVE_CONFIRMED',
  CANCEL_PENDING = 'CANCEL_PENDING',
  CANCEL_CONFIRMED = 'CANCEL_CONFIRMED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  REQUEST_REFUND_RECEIVED = 'REQUEST_REFUND_RECEIVED',
}

export enum PixInfractionAnalysisResultType {
  AGREED = 'AGREED',
  DISAGREED = 'DISAGREED',
}

export enum PixInfractionTransactionType {
  PAYMENT = 'PAYMENT',
  DEVOLUTION = 'DEVOLUTION',
  DEPOSIT = 'DEPOSIT',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
}

export enum PixInfractionType {
  // Both
  FRAUD = 'FRAUD',
  REFUND_REQUEST = 'REFUND_REQUEST',

  // Jira
  CANCEL_DEVOLUTION = 'CANCEL_DEVOLUTION',
}

export enum PixInfractionReport {
  DEBITED_PARTICIPANT = 'DEBITED_PARTICIPANT',
  CREDITED_PARTICIPANT = 'CREDITED_PARTICIPANT',
}

export type PixInfractionTransaction =
  | Partial<PixDevolution>
  | Partial<Payment>
  | Partial<PixDeposit>
  | Partial<PixDevolutionReceived>;

/**
 * PixInfraction entity.
 */
export interface PixInfraction extends Domain<string> {
  issueId?: number;
  infractionPspId?: string;
  operation?: Operation;
  transaction?: PixInfractionTransaction;
  transactionType: PixInfractionTransactionType;
  description?: string;
  infractionType: PixInfractionType;
  status: PixInfractionStatus;
  state: PixInfractionState;
  analysisResult?: PixInfractionAnalysisResultType;
  ispbDebitedParticipant?: string;
  ispbCreditedParticipant?: string;
  reportBy?: PixInfractionReport;
  ispb?: string;
  endToEndId?: string;
  creationDate?: Date;
  lastChangeDate?: Date;
  analysisDetails?: string;
  isReporter?: boolean;
  closingDate?: Date;
  cancellationDate?: Date;
  failed?: Failed;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PixInfractionEntity implements PixInfraction {
  id: string;
  issueId?: number;
  infractionPspId?: string;
  operation?: Operation;
  transaction?: PixInfractionTransaction;
  transactionType: PixInfractionTransactionType;
  description?: string;
  infractionType: PixInfractionType;
  status: PixInfractionStatus;
  state: PixInfractionState;
  analysisResult?: PixInfractionAnalysisResultType;
  ispbDebitedParticipant?: string;
  ispbCreditedParticipant?: string;
  reportBy?: PixInfractionReport;
  ispb?: string;
  endToEndId?: string;
  creationDate?: Date;
  lastChangeDate?: Date;
  analysisDetails?: string;
  isReporter?: boolean;
  closingDate?: Date;
  cancellationDate?: Date;
  failed?: Failed;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<PixInfraction>) {
    Object.assign(this, props);
  }
}
