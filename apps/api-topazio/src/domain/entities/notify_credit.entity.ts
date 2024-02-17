import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import {
  OperationType,
  StatusType,
  NotifyStateType,
  TransactionType,
} from './types.entity';

export interface NotifyCredit extends Domain<string> {
  transactionId: string;
  transactionType: TransactionType;
  isDevolution: boolean;
  status: StatusType;
  operation?: OperationType;
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
  endToEndId?: string;
  description?: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;
  isValidStatus(): boolean;
  isValidTransactionType(): boolean;
  isValidOperation(): boolean;
}

export class NotifyCreditEntity implements NotifyCredit {
  id: string;
  transactionId: string;
  transactionType: TransactionType;
  isDevolution: boolean;
  status: StatusType;
  operation?: OperationType;
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
  endToEndId?: string;
  description?: string;
  state?: NotifyStateType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyCredit>) {
    Object.assign(this, props);
  }

  isValidStatus(): boolean {
    return [StatusType.SUCCESS].includes(this.status);
  }

  isValidTransactionType(): boolean {
    return [TransactionType.CREDIT, TransactionType.CHARGEBACK].includes(
      this.transactionType,
    );
  }

  isValidOperation(): boolean {
    return this.operation === OperationType.CREDIT;
  }
}
