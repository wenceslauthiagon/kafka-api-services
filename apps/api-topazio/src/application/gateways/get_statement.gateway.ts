import {
  OperationType,
  PaymentStatusType,
  TransactionType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export interface GetStatementPixStatementRequest {
  page: number;
  size: number;
  startDate: Date;
  endDate: Date;
  transactionType?: TransactionType;
  clientAccountNumber?: string;
  clientKey?: string;
}

export interface GetStatementPixStatementResponse {
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

export interface GetStatementPixStatementGateway {
  getStatement(
    request: GetStatementPixStatementRequest,
  ): Promise<GetStatementPixStatementResponse[]>;
}
