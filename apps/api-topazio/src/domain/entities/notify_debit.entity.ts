import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import {
  OperationType,
  StatusType,
  NotifyStateType,
  TransactionType,
} from './types.entity';

export interface NotifyDebit extends Domain<string> {
  transactionId: string;
  transactionType?: TransactionType;
  isDevolution?: boolean;
  operation?: OperationType;
  status?: StatusType;
  statusMessage?: string;
  transactionOriginalID?: string;
  reason?: string;
  txId?: string;
  amount?: number;
  clientIspb?: string;
  clientBranch?: string;
  clientAccountNumber?: string;
  clientDocument?: string;
  clientName?: string;
  clientKey?: string;
  thirdPartIspb?: string;
  thirdPartBranch?: string;
  thirdPartAccountType?: AccountType;
  thirdPartAccountNumber?: string;
  thirdPartDocument?: string;
  thirdPartName?: string;
  thirdPartKey?: string;
  description?: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;
  isValidStatus(): boolean;
  isValidTransactionType(): boolean;
  isValidOperation(): boolean;
}

export class NotifyDebitEntity implements NotifyDebit {
  id: string;
  transactionId: string;
  transactionType?: TransactionType;
  isDevolution?: boolean;
  operation?: OperationType;
  status?: StatusType;
  statusMessage?: string;
  transactionOriginalID?: string;
  reason?: string;
  txId?: string;
  amount?: number;
  clientIspb?: string;
  clientBranch?: string;
  clientAccountNumber?: string;
  clientDocument?: string;
  clientName?: string;
  clientKey?: string;
  thirdPartIspb?: string;
  thirdPartBranch?: string;
  thirdPartAccountType?: AccountType;
  thirdPartAccountNumber?: string;
  thirdPartDocument?: string;
  thirdPartName?: string;
  thirdPartKey?: string;
  description?: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyDebit>) {
    Object.assign(this, props);
  }

  isValidStatus(): boolean {
    return [StatusType.SUCCESS].includes(this.status);
  }

  isValidTransactionType(): boolean {
    return this.transactionType === TransactionType.DEBIT;
  }

  isValidOperation(): boolean {
    return this.operation === OperationType.DEBIT;
  }
}
