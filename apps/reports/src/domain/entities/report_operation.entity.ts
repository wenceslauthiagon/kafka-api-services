import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency, Operation, TransactionType } from '@zro/operations/domain';

export enum OperationType {
  D = 'D',
  C = 'C',
}

/**
 * ReportOperation.
 */
export interface ReportOperation extends Domain<string> {
  operation: Operation;
  operationType: OperationType;
  transactionType: TransactionType;
  thirdPart: User;
  thirdPartBankCode?: string;
  thirdPartBranch?: string;
  thirdPartAccountNumber?: string;
  client: User;
  clientBankCode: string;
  clientBranch: string;
  clientAccountNumber: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportOperationEntity implements ReportOperation {
  id!: string;
  operation: Operation;
  operationType: OperationType;
  transactionType: TransactionType;
  thirdPart: User;
  thirdPartBankCode?: string;
  thirdPartBranch?: string;
  thirdPartAccountNumber?: string;
  client: User;
  clientBankCode: string;
  clientBranch: string;
  clientAccountNumber: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<ReportOperation>) {
    Object.assign(this, props);
  }
}
