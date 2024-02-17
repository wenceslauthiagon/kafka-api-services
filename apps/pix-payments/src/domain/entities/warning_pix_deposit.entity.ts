import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export enum WarningPixDepositState {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface WarningPixDeposit extends Domain<string> {
  operation: Operation;
  user: User;
  transactionTag: string;
  state: WarningPixDepositState;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WarningPixDepositEntity implements WarningPixDeposit {
  id: string;
  operation: Operation;
  user: User;
  transactionTag: string;
  state: WarningPixDepositState;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WarningPixDeposit>) {
    Object.assign(this, props);
  }
}
