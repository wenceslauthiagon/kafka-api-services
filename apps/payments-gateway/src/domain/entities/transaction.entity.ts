import { Domain } from '@zro/common';
import { OperationType } from '@zro/reports/domain';
import { PersonType } from '@zro/users/domain';

export class TransactionStatement {
  operationId: string;
  operationDate: Date;
  operationValue: number;
  operationType: OperationType;
  transactionTypeTag: string;
  thirdPartName: string;
  thirdPartDocument: string;
  thirdPartTypeDocument: PersonType;
  clientName: string;
  clientDocument: string;
  clientTypeDocument: PersonType;
  clientBankCode: string;
  clientBranch: string;
  clientAccountNumber: string;
  currencySymbol: string;

  constructor(props: Partial<TransactionStatement>) {
    Object.assign(this, props);
  }
}

export interface Transaction extends Domain<string> {
  page: number;
  size: number;
  createdDate: string;
  ttl?: number;
  transactions: TransactionStatement[];
}

export class TransactionEntity implements Transaction {
  page: number;
  size: number;
  createdDate: string;
  ttl?: number;
  transactions: TransactionStatement[];

  constructor(props: Partial<Transaction>) {
    Object.assign(this, props);
  }
}
