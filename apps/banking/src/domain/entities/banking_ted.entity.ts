import { Domain } from '@zro/common';
import { Operation } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export enum BankingTedState {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  FAILED = 'FAILED',
  FORWARDED = 'FORWARDED',
  CONFIRMED = 'CONFIRMED',
}

export enum PurposeCode {
  TED_10 = 10,
}

/**
 * BankingTed.
 */
export interface BankingTed extends Domain<number> {
  transactionId?: string;
  user?: User;
  state?: BankingTedState;
  amount?: number;
  operation: Operation;
  beneficiaryBankCode: string;
  beneficiaryBankName?: string;
  beneficiaryName: string;
  beneficiaryType: string;
  beneficiaryDocument: string;
  beneficiaryAgency: string;
  beneficiaryAccount: string;
  beneficiaryAccountDigit: string;
  beneficiaryAccountType: AccountType;
  createdAt?: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  forwardedAt?: Date;
  isAlreadyForwardedBankingTed(): boolean;
  isAlreadyFailedBankingTed(): boolean;
  isAlreadyPaidBankingTed(): boolean;
  isAlreadyConfirmedBankingTed(): boolean;
  hasReceipt(): boolean;
}

export class BankingTedEntity implements BankingTed {
  id: number;
  transactionId?: string;
  user?: User;
  state?: BankingTedState;
  amount?: number;
  operation: Operation;
  beneficiaryBankCode: string;
  beneficiaryBankName?: string;
  beneficiaryName: string;
  beneficiaryType: string;
  beneficiaryDocument: string;
  beneficiaryAgency: string;
  beneficiaryAccount: string;
  beneficiaryAccountDigit: string;
  beneficiaryAccountType: AccountType;
  createdAt?: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  forwardedAt?: Date;

  constructor(props: Partial<BankingTed>) {
    Object.assign(this, props);
  }

  isAlreadyForwardedBankingTed(): boolean {
    return BankingTedState.FORWARDED === this.state;
  }

  isAlreadyFailedBankingTed(): boolean {
    return BankingTedState.FAILED === this.state;
  }

  isAlreadyPaidBankingTed(): boolean {
    return [BankingTedState.WAITING, BankingTedState.CONFIRMED].includes(
      this.state,
    );
  }

  isAlreadyConfirmedBankingTed(): boolean {
    return [BankingTedState.CONFIRMED].includes(this.state);
  }

  hasReceipt(): boolean {
    return this.isAlreadyForwardedBankingTed();
  }
}
