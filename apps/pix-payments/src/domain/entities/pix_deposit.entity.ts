import { Domain, isDateBeforeThan, getMoment } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PersonDocumentType, PersonType, User } from '@zro/users/domain';
import { AccountType } from './payment.entity';

export enum PixDepositState {
  NEW = 'NEW',
  RECEIVED = 'RECEIVED',
  WAITING = 'WAITING',
  ERROR = 'ERROR',
  BLOCKED = 'BLOCKED',
}

/**
 * PixDeposit.
 */
export interface PixDeposit extends Domain<string> {
  user: User;
  wallet: Wallet;
  operation: Operation;
  state: PixDepositState;
  txId: string;
  endToEndId: string;
  amount: number;
  returnedAmount: number;
  clientBank: Bank;
  clientBranch: string;
  clientAccountNumber: string;
  clientPersonType: PersonDocumentType;
  clientDocument: string;
  clientName: string;
  clientKey: string;
  thirdPartBank: Bank;
  thirdPartBranch: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  thirdPartPersonType: PersonDocumentType;
  thirdPartDocument: string;
  thirdPartName?: string;
  thirdPartKey: string;
  description?: string;
  transactionTag: string;
  check?: { [key: string]: boolean };
  createdAt: Date;
  updatedAt: Date;
  hasReceipt(): boolean;
  isInAnalysis(): boolean;
  canCreateDevolution(intervalDays: number): boolean;
  getDocumentType(): PersonType;
}

export class PixDepositEntity implements PixDeposit {
  id: string;
  user: User;
  wallet: Wallet;
  operation: Operation;
  state: PixDepositState;
  txId: string;
  endToEndId: string;
  amount: number;
  returnedAmount: number;
  clientBank: Bank;
  clientBranch: string;
  clientAccountNumber: string;
  clientPersonType: PersonDocumentType;
  clientDocument: string;
  clientName: string;
  clientKey: string;
  thirdPartBank: Bank;
  thirdPartBranch: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  thirdPartPersonType: PersonDocumentType;
  thirdPartDocument: string;
  thirdPartName?: string;
  thirdPartKey: string;
  description?: string;
  transactionTag: string;
  check?: { [key: string]: boolean };
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixDeposit>) {
    Object.assign(this, props);
  }

  hasReceipt(): boolean {
    return [PixDepositState.RECEIVED].includes(this.state);
  }

  isInAnalysis(): boolean {
    return (
      [PixDepositState.WAITING].includes(this.state) &&
      Object.keys(this.check).some((k) => !this.check[k])
    );
  }

  canCreateDevolution(intervalDays: number): boolean {
    return !isDateBeforeThan(
      getMoment(this.createdAt).add(intervalDays, 'day').toDate(),
    );
  }

  getDocumentType(): PersonType {
    switch (this.thirdPartPersonType) {
      case PersonDocumentType.CPF:
        return PersonType.NATURAL_PERSON;
      case PersonDocumentType.CNPJ:
        return PersonType.LEGAL_PERSON;
      default:
        return this.thirdPartPersonType;
    }
  }
}
