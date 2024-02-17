import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { StatusType, NotifyStateType } from './types.entity';

export interface NotifyCompletion extends Domain<string> {
  transactionId: string;
  isDevolution: boolean;
  status: StatusType;
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
}

export class NotifyCompletionEntity implements NotifyCompletion {
  id?: string;
  transactionId: string;
  isDevolution: boolean;
  status: StatusType;
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

  constructor(props: Partial<NotifyCompletion>) {
    Object.assign(this, props);
  }

  isValidStatus(): boolean {
    return this.status === StatusType.COMPLETED;
  }
}
