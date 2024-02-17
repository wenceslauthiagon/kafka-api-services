import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { BankingContact } from '@zro/banking/domain';

/**
 * BankingAccountContact.
 */
export interface BankingAccountContact extends Domain<number> {
  bankingContact: BankingContact;
  branchNumber: string;
  accountNumber: string;
  accountDigit: string;
  bankName: string;
  bankCode: string;
  accountType: AccountType;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BankingAccountContactEntity implements BankingAccountContact {
  id: number;
  bankingContact: BankingContact;
  branchNumber: string;
  accountNumber: string;
  accountDigit: string;
  bankName: string;
  accountType: AccountType;
  bankCode: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<BankingAccountContact>) {
    Object.assign(this, props);
  }
}
