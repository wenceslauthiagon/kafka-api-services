import { Domain } from '@zro/common';
import { Wallet } from './wallet.entity';
import { Currency } from './currency.entity';

export enum WalletAccountState {
  PENDING = 'pending',
  ACTIVE = 'active',
  DEACTIVATE = 'deactivate',
}

/**
 * User wallet account.
 */
export interface WalletAccount extends Domain<number> {
  /**
   * Wallet uuid.
   */
  uuid: string;

  /**
   * Wallet owner.
   */
  wallet: Wallet;

  /**
   * Account currency.
   */
  currency: Currency;

  /**
   * Current account balance.
   */
  balance?: number;

  /**
   * The balance used by ongoing operations.
   */
  pendingAmount?: number;

  /**
   * The average price.
   */
  averagePrice?: number;

  /**
   * Account state. Default is active.
   */
  state: WalletAccountState;

  /**
   * Account number.
   */
  accountNumber?: string;

  /**
   * Account branch.
   */
  branchNumber?: string;

  /**
   * Account ID.
   */
  accountId?: number;

  /**
   * Wallet createdAt.
   */
  createdAt: Date;

  /**
   * Wallet updatedAt.
   */
  updatedAt: Date;

  /**
   * Check if wallet account is active.
   * @returns True if wallet account is active or false otherwise.
   */
  isActive: () => boolean;
}

export class WalletAccountEntity implements WalletAccount {
  id?: number;
  uuid: string;
  wallet: Wallet;
  currency: Currency;
  balance?: number;
  pendingAmount?: number;
  averagePrice?: number;
  state: WalletAccountState;
  accountNumber?: string;
  branchNumber?: string;
  accountId?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WalletAccount>) {
    Object.assign(this, props);
  }

  isActive(): boolean {
    return this.state === WalletAccountState.ACTIVE;
  }
}
