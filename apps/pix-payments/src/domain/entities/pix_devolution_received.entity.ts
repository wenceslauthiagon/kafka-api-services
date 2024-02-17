import { Domain } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PersonDocumentType, User } from '@zro/users/domain';
import { AccountType, Payment } from './payment.entity';

export enum PixDevolutionReceivedState {
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * PixDevolutionReceived.
 */
export interface PixDevolutionReceived extends Domain<string> {
  user: User;
  wallet: Wallet;
  operation: Operation;
  state: PixDevolutionReceivedState;
  payment?: Payment;
  txId?: string;
  endToEndId?: string;
  amount: number;
  returnedAmount?: number;
  clientBank?: Bank;
  clientBranch?: string;
  clientAccountNumber?: string;
  clientPersonType?: PersonDocumentType;
  clientDocument?: string;
  clientName?: string;
  clientKey?: string;
  thirdPartBank?: Bank;
  thirdPartBranch?: string;
  thirdPartAccountType?: AccountType;
  thirdPartAccountNumber?: string;
  thirdPartPersonType?: PersonDocumentType;
  thirdPartDocument?: string;
  thirdPartName?: string;
  thirdPartKey?: string;
  transactionTag?: string;
  description?: string;
  createdAt?: Date;
  hasReceipt(): boolean;
}

export class PixDevolutionReceivedEntity implements PixDevolutionReceived {
  id!: string;
  user!: User;
  wallet!: Wallet;
  operation: Operation;
  state!: PixDevolutionReceivedState;
  payment?: Payment;
  txId?: string;
  endToEndId?: string;
  amount: number;
  returnedAmount?: number;
  clientBank?: Bank;
  clientBranch?: string;
  clientAccountNumber?: string;
  clientPersonType?: PersonDocumentType;
  clientDocument?: string;
  clientName?: string;
  clientKey?: string;
  thirdPartBank?: Bank;
  thirdPartBranch?: string;
  thirdPartAccountType?: AccountType;
  thirdPartAccountNumber?: string;
  thirdPartPersonType?: PersonDocumentType;
  thirdPartDocument?: string;
  thirdPartName?: string;
  thirdPartKey?: string;
  transactionTag?: string;
  description?: string;
  createdAt?: Date;

  constructor(props: Partial<PixDevolutionReceived>) {
    Object.assign(this, props);
  }

  hasReceipt(): boolean {
    return [PixDevolutionReceivedState.READY].includes(this.state);
  }
}
