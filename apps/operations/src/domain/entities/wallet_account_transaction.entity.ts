import { Domain } from '@zro/common';
import { Operation } from './operation.entity';
import { WalletAccount } from './wallet_account.entity';

export enum WalletAccountTransactionState {
  DONE = 'done',
}

export enum WalletAccountTransactionType {
  CREDIT = 'C',
  DEBIT = 'D',
}

/**
 * Wallet account transaction represents all debits and credits on user account.
 */
export interface WalletAccountTransaction extends Domain<string> {
  /**
   * Account owner.
   */
  walletAccount: WalletAccount;

  /**
   * Operation owner.
   */
  operation: Operation;

  /**
   * Transaction type.
   */
  transactionType: WalletAccountTransactionType;

  /**
   * Transaction value.
   */
  value: number;

  /**
   * Account balance before this transaction.
   */
  previousBalance: number;

  /**
   * Account balance after this transaction.
   */
  updatedBalance: number;

  /**
   * Account state. Default is active.
   */
  state: WalletAccountTransactionState;

  /**
   * Creation date.
   */
  createdAt: Date;
}

export class WalletAccountTransactionEntity
  implements WalletAccountTransaction
{
  id?: string;
  walletAccount: WalletAccount;
  operation: Operation;
  transactionType: WalletAccountTransactionType;
  value: number;
  previousBalance: number;
  updatedBalance: number;
  state: WalletAccountTransactionState;
  createdAt: Date;

  constructor(props: Partial<WalletAccountTransaction>) {
    Object.assign(this, props);
  }
}
