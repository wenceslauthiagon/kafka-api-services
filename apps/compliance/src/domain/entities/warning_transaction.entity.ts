import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';

export enum WarningTransactionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED',
}

export enum WarningTransactionAnalysisResultType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED', //expired means rejected after 72h.
}

export const WARNING_TRANSACTION_REASON: { [key: string]: string } = {
  HandleWarningPixDepositIsCefEventUseCase: 'Caixa Economica Federal',
  HandleWarningPixDepositIsSantanderCnpjEventUseCase: 'CNPJ do Santander',
  HandleWarningPixDepositIsOverWarningIncomeEventUseCase:
    'Acima da renda declarada',
  HandleWarningPixDepositIsReceitaFederalEventUseCase:
    'Credito Receita Federal',
  HandleWarningPixDepositIsSuspectCpfEventUseCase: 'CPF na Blocklist',
  HandleWarningPixDepositIsDuplicatedEventUseCase: 'Duplicado em 24h',
  HandleWarningPixDepositIsSuspectBankEventUseCase:
    'Corretora/Banco na Blocklist',
};

export function warningTransactionReasonBuilder(check: string) {
  return WARNING_TRANSACTION_REASON[check] ?? check;
}

export interface WarningTransaction extends Domain<string> {
  operation: Operation;
  status: WarningTransactionStatus;
  analysisResult?: WarningTransactionAnalysisResultType;
  endToEndId?: string;
  transactionTag: string;
  issueId?: number;
  reason?: string;
  analysisDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isClosed(): boolean;
  isFailed(): boolean;
}

export class WarningTransactionEntity implements WarningTransaction {
  id: string;
  operation: Operation;
  status: WarningTransactionStatus;
  analysisResult?: WarningTransactionAnalysisResultType;
  endToEndId?: string;
  transactionTag: string;
  issueId?: number;
  reason?: string;
  analysisDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<WarningTransaction>) {
    Object.assign(this, props);
  }

  isClosed(): boolean {
    return this.status === WarningTransactionStatus.CLOSED;
  }

  isFailed(): boolean {
    return this.status === WarningTransactionStatus.FAILED;
  }
}
