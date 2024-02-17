import { Domain, Failed } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { PixDevolutionCode } from '@zro/pix-payments/domain';

export enum WarningPixDevolutionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  RECEIVED = 'RECEIVED',
}

export enum WarningPixDevolutionState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

/**
 * WarningPixDevolution.
 */
export interface WarningPixDevolution extends Domain<string> {
  user: User;
  operation: Operation;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: WarningPixDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WarningPixDevolutionEntity implements WarningPixDevolution {
  id: string;
  user: User;
  operation: Operation;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: WarningPixDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WarningPixDevolution>) {
    Object.assign(this, props);
  }
}
