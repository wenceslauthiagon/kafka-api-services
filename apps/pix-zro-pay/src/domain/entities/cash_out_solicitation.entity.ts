import { Domain } from '@zro/common';
import { BankAccount, Company } from '@zro/pix-zro-pay/domain';

export enum CashOutSolicitationStatus {
  PENDING = 'pending',
  FAILED = 'failed',
}

export interface CashOutSolicitation extends Domain<number> {
  company?: Company;
  financialEmail?: string;
  bankAccount?: BankAccount;
  valueCents: number;
  paymentDate: Date;
  status?: CashOutSolicitationStatus;
  responsibleUserObservation: string;
  requesterUserObservation: string;
  responsibleUserId: number;
  requesterUserId: number;
  providerHolderName: string;
  providerHolderCnpj: string;
  providerBankName: string;
  providerBankBranch: string;
  providerBankAccountNumber: string;
  providerBankIspb: string;
  providerBankAccountType: string;
  errorDescription?: string;
  endToEndId?: string;
  transactionType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CashOutSolicitationEntity implements CashOutSolicitation {
  id?: number;
  company?: Company;
  financialEmail?: string;
  bankAccount?: BankAccount;
  valueCents: number;
  paymentDate: Date;
  status?: CashOutSolicitationStatus;
  responsibleUserObservation: string;
  requesterUserObservation: string;
  responsibleUserId: number;
  requesterUserId: number;
  providerHolderName: string;
  providerHolderCnpj: string;
  providerBankName: string;
  providerBankBranch: string;
  providerBankAccountNumber: string;
  providerBankIspb: string;
  providerBankAccountType: string;
  errorDescription?: string;
  endToEndId?: string;
  transactionType?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<CashOutSolicitation>) {
    Object.assign(this, props);
  }
}
