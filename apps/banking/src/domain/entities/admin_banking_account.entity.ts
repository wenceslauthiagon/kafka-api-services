import { Domain } from '@zro/common';
import { Admin } from '@zro/admin/domain';
import { AccountType } from '@zro/pix-payments/domain';

/**
 * AdminBankingAccount.
 */
export interface AdminBankingAccount extends Domain<string> {
  document: string;
  fullName: string;
  branchNumber: string;
  accountNumber: string;
  accountDigit: string;
  accountType: AccountType;
  bankName: string;
  bankCode: string;
  description: string;
  enabled: boolean;
  createdByAdmin: Admin;
  updatedByAdmin: Admin;
  createdAt?: Date;
  updatedAt?: Date;
  isActive(): boolean;
}

export class AdminBankingAccountEntity implements AdminBankingAccount {
  id: string;
  document: string;
  fullName: string;
  branchNumber: string;
  accountNumber: string;
  accountDigit: string;
  accountType: AccountType;
  bankName: string;
  bankCode: string;
  description: string;
  enabled: boolean;
  createdByAdmin: Admin;
  updatedByAdmin: Admin;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<AdminBankingAccount>) {
    Object.assign(this, props);
  }

  isActive(): boolean {
    return this.enabled;
  }
}
