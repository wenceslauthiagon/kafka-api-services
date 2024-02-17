import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';

/**
 * BankingTedReceived.
 */
export interface BankingTedReceived extends Domain<number> {
  operation: Operation;
  transactionId?: string;
  ownerName?: string;
  ownerDocument?: string;
  ownerBankAccount?: string;
  ownerBankBranch?: string;
  ownerBankCode?: string;
  ownerBankName?: string;
  bankStatementId?: string;
  notifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BankingTedReceivedEntity implements BankingTedReceived {
  id: number;
  operation: Operation;
  transactionId?: string;
  ownerName?: string;
  ownerDocument?: string;
  ownerBankAccount?: string;
  ownerBankBranch?: string;
  ownerBankCode?: string;
  ownerBankName?: string;
  bankStatementId?: string;
  notifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<BankingTedReceived>) {
    Object.assign(this, props);
  }
}
