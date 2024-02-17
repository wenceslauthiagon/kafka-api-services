import { Domain, Failed } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDevolutionReceived,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';

export enum PixRefundDevolutionState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export type PixRefundDevolutionTransaction =
  | Partial<PixDeposit>
  | Partial<PixDevolutionReceived>;

export enum PixRefundDevolutionTransactionType {
  DEPOSIT = 'DEPOSIT',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
}
/**
 * PixRefundDevolution.
 */
export interface PixRefundDevolution extends Domain<string> {
  user: User;
  operation: Operation;
  transaction: PixRefundDevolutionTransaction;
  transactionType: PixRefundDevolutionTransactionType;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: PixRefundDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PixRefundDevolutionEntity implements PixRefundDevolution {
  id: string;
  user: User;
  operation: Operation;
  transaction: PixRefundDevolutionTransaction;
  transactionType: PixRefundDevolutionTransactionType;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: PixRefundDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixRefundDevolution>) {
    Object.assign(this, props);
  }
}
