import { Domain, Failed } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PixDeposit } from './pix_deposit.entity';

export enum PixDevolutionCode {
  ORIGINAL = 'MD06',
  FRAUD = 'FR01',
  PSP_ERROR = 'BE08',
  WITHDRAWAL_CHANGE = 'SL02',
}

export enum PixDevolutionState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

/**
 * PixDevolution.
 */
export interface PixDevolution extends Domain<string> {
  user: User;
  wallet: Wallet;
  operation: Operation;
  deposit: PixDeposit;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: PixDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
  hasReceipt(): boolean;
}

export class PixDevolutionEntity implements PixDevolution {
  id: string;
  user: User;
  wallet: Wallet;
  operation: Operation;
  deposit: PixDeposit;
  endToEndId?: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
  chargebackReason?: string;
  failed?: Failed;
  state: PixDevolutionState;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixDevolution>) {
    Object.assign(this, props);
  }

  hasReceipt(): boolean {
    return [PixDevolutionState.CONFIRMED].includes(this.state);
  }
}
