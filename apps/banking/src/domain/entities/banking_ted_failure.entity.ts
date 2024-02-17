import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { BankingTed } from '@zro/banking/domain';

/**
 * BankingTedFailure.
 */
export interface BankingTedFailure extends Domain<number> {
  operation: Operation;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  bankingTed?: BankingTed;
  failureCode?: string;
  failureMessage?: string;
}

export class BankingTedFailureEntity implements BankingTedFailure {
  id: number;
  operation: Operation;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  bankingTed?: BankingTed;
  failureCode?: string;
  failureMessage?: string;

  constructor(props: Partial<BankingTedFailure>) {
    Object.assign(this, props);
  }
}
