import {
  OperationType,
  PaymentStatusType,
  TransactionType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

export interface GetPaymentPixStatementRequest {
  id: string;
}

export interface GetPaymentPixStatementResponse {
  id: string;
  createdAt: Date;
  transactionType: TransactionType;
  operation: OperationType;
  status: PaymentStatusType;
  transactionOriginalId: string;
  reason: string;
  txId: string;
  isDevolution: boolean;
  amount: number;
  clientBankIspb: string;
  clientBranch: string;
  clientAccountNumber: string;
  clientDocument: string;
  clientName: string;
  clientKey: string;
  thirdPartBankIspb: string;
  thirdPartBranch: string;
  thirdPartAccountType: AccountType;
  thirdPartAccountNumber: string;
  thirdPartDocument: string;
  thirdPartName: string;
  thirdPartKey: string;
  endToEndId: string;
  totalDevolution: number;
  description: string;
  initiatorDocument: string;
  consentDate: Date;
}

export interface GetPaymentPixStatementGateway {
  getPayment(
    request: GetPaymentPixStatementRequest,
  ): Promise<GetPaymentPixStatementResponse>;
}
