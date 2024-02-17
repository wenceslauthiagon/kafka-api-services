import { Domain } from '@zro/common';
import {
  OperationType,
  PaymentStatusType,
  TransactionType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export interface Statement {
  transactionId: string;
  clientAccountNumber: string;
  clientBranch: string;
  clientDocument: string;
  clientBankIspb: string;
  clientKey: string;
  clientName: string;
  createdAt: Date;
  description: string;
  isDevolution: boolean;
  reason: string;
  status: PaymentStatusType;
  thirdPartAccountNumber: string;
  thirdPartAccountType: AccountType;
  thirdPartBranch: string;
  thirdPartDocument: string;
  thirdPartBankIspb: string;
  thirdPartKey: string;
  thirdPartName: string;
  transactionType: TransactionType;
  txId: string;
  endToEndId: string;
  operation: OperationType;
  transactionOriginalId: string;
  amount: number;
}

export interface PixStatement extends Domain<string> {
  page: number;
  size: number;
  createdDate: string;
  ttl?: number;
  statements: Statement[];
}

export class PixStatementEntity implements PixStatement {
  page: number;
  size: number;
  createdDate: string;
  ttl?: number;
  statements: Statement[];

  constructor(props: Partial<PixStatement>) {
    Object.assign(this, props);
  }
}
