import { Operation } from '@zro/operations/domain';

export type CreateWarningTransactionRequest = {
  operation: Operation;
  transactionTag: string;
  endToEndId?: string;
  reason?: string;
};

export interface CreateWarningTransactionResponse {
  issueId: number;
  key: string;
}

export interface CreateWarningTransactionGateway {
  createWarningTransaction(
    request: CreateWarningTransactionRequest,
  ): Promise<CreateWarningTransactionResponse>;
}
