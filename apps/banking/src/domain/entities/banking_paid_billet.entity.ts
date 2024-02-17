import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';

export enum BankingPaidBilletConciliationStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum BankingPaidBilletDockStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

/**
 * BankingPaidBillet.
 */
export interface BankingPaidBillet extends Domain<number> {
  operation: Operation;
  barcode?: string;
  typeableLine?: string;
  assignor?: string;
  assignorDocument?: string;
  dockAdjustmentId?: string;
  dockTransactionCode?: string;
  dockPaymentConfirmationId?: string;
  dockStatus?: BankingPaidBilletDockStatus;
  settledDate?: Date;
  transactionIdPayment?: string;
  conciliationStatus?: BankingPaidBilletConciliationStatus;
  failureMessage?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BankingPaidBilletEntity implements BankingPaidBillet {
  id: number;
  operation: Operation;
  barcode?: string;
  typeableLine?: string;
  assignor?: string;
  assignorDocument?: string;
  dockAdjustmentId?: string;
  dockTransactionCode?: string;
  dockPaymentConfirmationId?: string;
  dockStatus?: BankingPaidBilletDockStatus;
  settledDate?: Date;
  transactionIdPayment?: string;
  conciliationStatus?: BankingPaidBilletConciliationStatus;
  failureMessage?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<BankingPaidBillet>) {
    Object.assign(this, props);
  }
}
