import { Domain } from '@zro/common';
import { Company } from './company.entity';
import { BankAccount } from './bank_account.entity';
import { Client } from './client.entity';

export enum QrCodeFormat {
  PAYLOAD = 'PAYLOAD',
}

export enum QrCodeState {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * QrCode.
 */
export interface QrCode extends Domain<string> {
  transactionUuid: string;
  txId: string;
  description?: string;
  payerDocument?: number;
  emv: string;
  expirationDate?: string;
  value?: number;
  company: Company;
  bankAccount: BankAccount;
  client: Client;
  merchantId: string;
  gatewayName: string;
  createdAt: Date;
}

export class QrCodeEntity implements QrCode {
  transactionUuid: string;
  txId: string;
  description?: string;
  payerDocument?: number;
  emv: string;
  expirationDate?: string;
  value?: number;
  company: Company;
  bankAccount: BankAccount;
  client: Client;
  merchantId: string;
  gatewayName: string;
  createdAt: Date;

  constructor(props: Partial<QrCode>) {
    Object.assign(this, props);
  }
}
