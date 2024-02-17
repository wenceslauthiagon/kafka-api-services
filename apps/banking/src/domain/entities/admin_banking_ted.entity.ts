import { Domain } from '@zro/common';
import { Admin } from '@zro/admin/domain';
import { AdminBankingAccount } from '@zro/banking/domain';

export enum AdminBankingTedState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  FAILED = 'FAILED',
  FORWARDED = 'FORWARDED',
  CONFIRMED = 'CONFIRMED',
}

/**
 * AdminBankingTed.
 */
export interface AdminBankingTed extends Domain<string> {
  source: AdminBankingAccount;
  destination: AdminBankingAccount;
  state: AdminBankingTedState;
  description: string;
  value: number;
  transactionId?: string;
  confirmedAt?: Date;
  failedAt?: Date;
  forwardedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
  createdByAdmin: Admin;
  updatedByAdmin: Admin;
  createdAt?: Date;
  updatedAt?: Date;
  isAlreadyForwardedAdminBankingTed(): boolean;
  isAlreadyFailedAdminBankingTed(): boolean;
  isAlreadyPaidAdminBankingTed(): boolean;
  isAlreadyConfirmedAdminBankingTed(): boolean;
}

export class AdminBankingTedEntity implements AdminBankingTed {
  id: string;
  source: AdminBankingAccount;
  destination: AdminBankingAccount;
  state: AdminBankingTedState;
  description: string;
  value: number;
  transactionId?: string;
  confirmedAt?: Date;
  failedAt?: Date;
  forwardedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
  createdByAdmin: Admin;
  updatedByAdmin: Admin;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<AdminBankingTed>) {
    Object.assign(this, props);
  }

  isAlreadyForwardedAdminBankingTed(): boolean {
    return AdminBankingTedState.FORWARDED === this.state;
  }

  isAlreadyFailedAdminBankingTed(): boolean {
    return AdminBankingTedState.FAILED === this.state;
  }

  isAlreadyPaidAdminBankingTed(): boolean {
    return [
      AdminBankingTedState.WAITING,
      AdminBankingTedState.CONFIRMED,
    ].includes(this.state);
  }

  isAlreadyConfirmedAdminBankingTed(): boolean {
    return [AdminBankingTedState.CONFIRMED].includes(this.state);
  }
}
