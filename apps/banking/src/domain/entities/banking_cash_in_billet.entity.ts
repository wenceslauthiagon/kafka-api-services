import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';

export enum BankingCashInBilletStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

/**
 * BankingCashInBillet.
 */
export interface BankingCashInBillet extends Domain<number> {
  barCode: string;
  number: string;
  thirdPartyNumber: string;
  typeableLine: string;
  value: number;
  base64Pdf: string;
  dueDate: Date;
  settledDate?: Date;
  status: BankingCashInBilletStatus;
  user: User;
  operation?: Operation;
  createdAt: Date;
  updatedAt: Date;
}

export class BankingCashInBilletEntity implements BankingCashInBillet {
  id: number;
  barCode: string;
  number: string;
  thirdPartyNumber: string;
  typeableLine: string;
  value: number;
  base64Pdf: string;
  dueDate: Date;
  settledDate?: Date;
  status: BankingCashInBilletStatus;
  user: User;
  operation?: Operation;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<BankingCashInBillet>) {
    Object.assign(this, props);
  }
}
