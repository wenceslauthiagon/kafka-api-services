import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from './currency.entity';
import { TransactionType } from './transaction_type.entity';
import { WalletAccount } from './wallet_account.entity';
import { UserLimitTracker } from './user_limit_tracker.entity';

export enum OperationState {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  UNDONE = 'undone',
  PENDING = 'pending',
  REVERTED = 'reverted',
}

export enum TransactionTypeTag {
  P2PBT = 'P2PBT',
  WITHDRAW = 'WITHDRAW',
  GWDEB = 'GWDEB',
  GWCRED = 'GWCRED',
  PIXCHANGE = 'PIXCHANGE',
  PIXDEVREC = 'PIXDEVREC',
  PIXDEVSEND = 'PIXDEVSEND',
  PIXREC = 'PIXREC',
  PIXREFUND = 'PIXREFUND',
  PIXREFUNDDEV = 'PIXREFUNDDEV',
  PIXSEND = 'PIXSEND',
  PIXWITHDRAWL = 'PIXWITHDRAWL',
}

export enum OperationAnalysisTag {
  DATE_LIMIT_INCLUDED = 'date_limit_included',
  DAILY_INTERVAL_LIMIT_INCLUDED = 'daily_interval_limit_included',
  MONTHLY_INTERVAL_LIMIT_INCLUDED = 'monthly_interval_limit_included',
  ANNUAL_INTERVAL_LIMIT_INCLUDED = 'annual_interval_limit_included',
}

export function getOperationLimitCheckStates(): OperationState[] {
  return [OperationState.ACCEPTED, OperationState.PENDING];
}

/**
 * Wallet account transaction represents all debits and credits on user account.
 */
export interface Operation extends Domain<string> {
  /**
   * Operation owner.
   */
  owner?: User;

  /**
   * Owner wallet account.
   */
  ownerWalletAccount?: WalletAccount;

  /**
   * Operation beneficiary.
   */
  beneficiary?: User;

  /**
   * Beneficiary wallet account.
   */
  beneficiaryWalletAccount?: WalletAccount;

  /**
   * Operation type.
   */
  transactionType: TransactionType;

  /**
   * Account currency.
   */
  currency: Currency;

  /**
   * Operation base value.
   */
  rawValue?: number;

  /**
   * Operation fee.
   */
  fee?: number;

  /**
   * Operation final value.
   */
  value: number;

  /**
   * Description.
   */
  description: string;

  /**
   * Operation related to this one. Conversion operation use two operations
   * (one in each currency) to be represented.
   */
  operationRef?: Operation;

  /**
   * Operation chargeback.
   */
  chargeback?: Operation;

  /**
   * Account state. Default is active.
   */
  state: OperationState;

  /**
   * Creation date.
   */
  createdAt: Date;

  /**
   * Reverted date.
   */
  revertedAt?: Date;

  /**
   * Operation ownerRequestedRawValue.
   */
  ownerRequestedRawValue?: number;

  /**
   * Operation ownerRequestedFee.
   */
  ownerRequestedFee?: number;

  /**
   * Operation data analysis tags.
   */
  analysisTags?: OperationAnalysisTag[];

  /**
   * Operation associated user limit tracker.
   */
  userLimitTracker?: UserLimitTracker;

  /**
   * Check if operation state is pending.
   */
  isPending: () => boolean;

  /**
   * Check if operation state is accepted.
   */
  isAccepted: () => boolean;

  /**
   * Check if operation state is reverted.
   */
  isReverted: () => boolean;
}

export class OperationEntity implements Operation {
  id?: string;
  owner?: User = null;
  ownerWalletAccount?: WalletAccount = null;
  beneficiary?: User = null;
  beneficiaryWalletAccount?: WalletAccount = null;
  transactionType: TransactionType;
  currency: Currency;
  rawValue?: number = 0;
  fee?: number = 0;
  value: number;
  description: string;
  operationRef?: Operation = null;
  chargeback?: Operation = null;
  state: OperationState = OperationState.ACCEPTED;
  analysisTags?: OperationAnalysisTag[];
  userLimitTracker?: UserLimitTracker;
  createdAt: Date = null;
  revertedAt?: Date = null;
  ownerRequestedRawValue?: number;
  ownerRequestedFee?: number;

  constructor(props: Partial<Operation>) {
    Object.assign(this, props);
  }

  isPending(): boolean {
    return this.state === OperationState.PENDING;
  }

  isAccepted(): boolean {
    return this.state === OperationState.ACCEPTED;
  }

  isReverted(): boolean {
    return this.state === OperationState.REVERTED;
  }
}
