import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { NotifyStateType } from './types.entity';

export interface NotifyConfirmBankingTed extends Domain<string> {
  transactionId: string;
  state: NotifyStateType;
  document: string;
  bankCode: string;
  branch: string;
  accountNumber: string;
  accountType: AccountType;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export class NotifyConfirmBankingTedEntity implements NotifyConfirmBankingTed {
  id?: string;
  transactionId: string;
  state: NotifyStateType;
  document: string;
  bankCode: string;
  branch: string;
  accountNumber: string;
  accountType: AccountType;
  value: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<NotifyConfirmBankingTed>) {
    Object.assign(this, props);
  }
}
