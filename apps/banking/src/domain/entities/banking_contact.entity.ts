import { Domain } from '@zro/common';
import { User, PersonDocumentType } from '@zro/users/domain';
import { BankingAccountContact } from '@zro/banking/domain';

/**
 * BankingContact.
 */
export interface BankingContact extends Domain<number> {
  user: User;
  name: string;
  documentType: PersonDocumentType;
  document: string;
  contactUser?: User;
  accounts: BankingAccountContact[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class BankingContactEntity implements BankingContact {
  id: number;
  user: User;
  name: string;
  documentType: PersonDocumentType;
  document: string;
  contactUser?: User;
  accounts: BankingAccountContact[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<BankingContact>) {
    Object.assign(this, props);
  }
}
