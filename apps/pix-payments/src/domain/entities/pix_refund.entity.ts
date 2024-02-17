import { Bank } from '@zro/banking/domain';
import { Domain, Failed, getMoment, isDateBeforeThan } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDevolution,
  PixInfraction,
  Payment,
  PixDevolutionReceived,
  PixRefundDevolution,
} from '@zro/pix-payments/domain';

export enum PixRefundReason {
  FRAUD = 'FRAUD',
  OPERATIONAL_FLAW = 'OPERATIONAL_FLAW',
  REFUND_CANCELLED = 'REFUND_CANCELLED',
}

export enum PixRefundRejectionReason {
  NO_BALANCE = 'NO_BALANCE',
  ACCOUNT_CLOSURE = 'ACCOUNT_CLOSURE',
  CANNOT_REFUND = 'CANNOT_REFUND',
  OTHER = 'OTHER',
}

export enum PixRefundStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  RECEIVED = 'RECEIVED',
}

export enum PixRefundState {
  RECEIVE_PENDING = 'RECEIVE_PENDING',
  RECEIVE_CONFIRMED = 'RECEIVE_CONFIRMED',
  CANCEL_PENDING = 'CANCEL_PENDING',
  CANCEL_CONFIRMED = 'CANCEL_CONFIRMED',
  CLOSED_PENDING = 'CLOSED_PENDING',
  CLOSED_WAITING = 'CLOSED_WAITING',
  CLOSED_CONFIRMED = 'CLOSED_CONFIRMED',
  ERROR = 'ERROR',
}

export enum PixRefundCode {
  CANCELLATION = 'FOCR',
  FRAUD = 'FR01',
}

export type PixRefundTransaction =
  | Partial<PixDevolution>
  | Partial<Payment>
  | Partial<PixDeposit>
  | Partial<PixDevolutionReceived>;

export enum PixRefundTransactionType {
  PAYMENT = 'PAYMENT',
  DEVOLUTION = 'DEVOLUTION',
  DEPOSIT = 'DEPOSIT',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
}

export enum PixRefundType {
  REQUESTING = 'REQUESTING',
  CONTESTED = 'CONTESTED',
}

/**
 * PixRefund.
 */
export interface PixRefund extends Domain<string> {
  solicitationPspId?: string;
  infraction?: PixInfraction;
  operation?: Operation;
  transaction: PixRefundTransaction;
  transactionType: PixRefundTransactionType;
  issueId?: number;
  contested?: boolean;
  amount: number;
  description?: string;
  reason?: PixRefundReason;
  requesterBank?: Bank;
  responderBank?: Bank;
  status: PixRefundStatus;
  state: PixRefundState;
  analysisDetails?: string;
  rejectionReason?: PixRefundRejectionReason;
  refundDevolution?: PixRefundDevolution;
  failed?: Failed;
  createdAt: Date;
  updatedAt: Date;
  canCreateRefundDevolution(intervalDays: number): boolean;
}

export class PixRefundEntity implements PixRefund {
  id: string;
  solicitationPspId?: string;
  infraction?: PixInfraction;
  operation?: Operation;
  transaction: PixRefundTransaction;
  transactionType: PixRefundTransactionType;
  issueId?: number;
  contested?: boolean;
  amount: number;
  description?: string;
  reason?: PixRefundReason;
  requesterBank?: Bank;
  responderBank?: Bank;
  status: PixRefundStatus;
  state: PixRefundState;
  analysisDetails?: string;
  rejectionReason?: PixRefundRejectionReason;
  refundDevolution?: PixRefundDevolution;
  failed?: Failed;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixRefund>) {
    Object.assign(this, props);
  }

  canCreateRefundDevolution(intervalDays: number): boolean {
    return !isDateBeforeThan(
      getMoment(this.createdAt).add(intervalDays, 'day').toDate(),
    );
  }
}
