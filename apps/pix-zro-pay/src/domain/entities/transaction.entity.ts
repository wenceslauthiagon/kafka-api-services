import { Domain } from '@zro/common';
import { Company } from '@zro/payments-gateway/interface';
import { Client } from './client.entity';
import { BankAccount } from './bank_account.entity';

export enum TransactionType {
  TRANSACTION = 'transaction',
  WITHDRAW = 'withdraw',
  REFUND = 'refund',
  RETURNED = 'returned',
  FAILED_REFUND = 'failed_refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CANCELED = 'canceled',
  PAID = 'paid',
  FAILED = 'failed',
  AWAITING = 'awaiting',
}

export enum TransactionProcessStatus {
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSED = 'processed',
  MUST_BE_REFUNDED = 'must_be_refunded',
}

export enum TransactionPaymentType {
  PIX = 'pix',
  TED = 'ted',
}

/**
 * Transaction.
 */
export interface Transaction extends Domain<number> {
  paymentType: TransactionPaymentType;
  valueCents: number;
  feeValue: number;
  feeInPercent: number;
  client?: Client;
  company: Company;
  uuid: string;
  status: TransactionStatus;
  bankAccount?: BankAccount;
  pixKeyType?: string;
  pixKey?: string;
  transactionType: TransactionType;
  description?: string;
  instantPaymentIdField?: string;
  transactionOrigin: string;
  errorDescription?: string;
  bankReference?: string;
  referenceId?: string;
  paymentDate?: Date;
  isManual: boolean;
  endToEndIdField?: string;
  warning?: boolean;
  oldValueCents?: number;
  merchantId?: string;
  pspIspb?: string;
  pspBankName?: string;
  totalFee?: number;
  mainCompanyTotalFeeCents?: number;
  processStatus?: TransactionProcessStatus;
  zroTotalValueInCents?: number;
  isTransferredToMainCompany?: boolean;
  p2pId?: string;
  p2pOperationId?: string;
  paidBy?: string;
  p2pErrorDescription?: string;
  paidByClientId?: number;
  isManualRefund?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TransactionEntity implements Transaction {
  id: number;
  paymentType: TransactionPaymentType;
  valueCents: number;
  feeValue: number;
  feeInPercent: number;
  client?: Client;
  company: Company;
  uuid: string;
  status: TransactionStatus;
  bankAccount?: BankAccount;
  pixKeyType?: string;
  pixKey?: string;
  transactionType: TransactionType;
  description?: string;
  instantPaymentIdField?: string;
  transactionOrigin: string;
  errorDescription?: string;
  bankReference?: string;
  referenceId?: string;
  paymentDate?: Date;
  isManual: boolean;
  endToEndIdField?: string;
  warning?: boolean;
  oldValueCents?: number;
  merchantId?: string;
  pspIspb?: string;
  pspBankName?: string;
  totalFee?: number;
  mainCompanyTotalFeeCents?: number;
  processStatus?: TransactionProcessStatus;
  zroTotalValueInCents?: number;
  isTransferredToMainCompany?: boolean;
  p2pId?: string;
  p2pOperationId?: string;
  paidBy?: string;
  p2pErrorDescription?: string;
  paidByClientId?: number;
  isManualRefund?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<Transaction>) {
    Object.assign(this, props);
  }
}
