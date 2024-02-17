import { Domain } from '@zro/common';
import { LimitType } from './limit_type.entity';

/**
 * Participants enumeration describes how many users are required by an operation.
 */
export enum TransactionTypeParticipants {
  /**
   * Transaction requires both owner and beneficiary.
   */
  BOTH = 'BOTH',

  /**
   * Transaction requires only owner.
   */
  OWNER = 'OWNER',

  /**
   * Transaction requires only beneficiary.
   */
  BENEFICIARY = 'BENEFICIARY',
}

/**
 * State enumeration describes system control of transactions types.
 */
export enum TransactionTypeState {
  /**
   * Transaction is active and ready for use.
   */
  ACTIVE = 'active',

  /**
   * Transaction is not active and no new operations could be created with this type.
   */
  DEACTIVATE = 'deactivate',
}

/**
 * Describes allowed operations.
 */
export interface TransactionType extends Domain<number> {
  /**
   * Transaction type title. Example: 'BTC Sending'
   */
  title: string;

  /**
   * Unique constant type identifier. Example: 'BTCSEND'
   */
  tag: string;

  /**
   * Required users to create an operation of this type.
   */
  participants: TransactionTypeParticipants;

  /**
   * System control of the transaction type.
   */
  state: TransactionTypeState;

  /**
   * Limit type associated with transaction type.
   */
  limitType?: LimitType;

  /**
   * Check if transaction is active.
   * @returns {boolean} True if transaction is active or false otherwise.
   */
  isActive: () => boolean;

  /**
   * Check if transaction requires both participants.
   * @returns {boolean} True if transaction requires both participants or false otherwise.
   */
  isBothParticipantsRequired: () => boolean;

  /**
   * Check if transaction requires only owner.
   * @returns {boolean} True if transaction requires only owner or false otherwise.
   */
  isOwnerParticipantsRequired: () => boolean;

  /**
   * Check if transaction requires only beneficiary.
   * @returns {boolean} True if transaction requires only beneficiary or false otherwise.
   */
  isBeneficiaryParticipantsRequired: () => boolean;
}

/**
 * Transaction type entity implementation.
 */
export class TransactionTypeEntity implements TransactionType {
  id?: number;
  title: string;
  tag: string;
  participants: TransactionTypeParticipants;
  state: TransactionTypeState;
  limitType?: LimitType;

  constructor(props: Partial<TransactionType>) {
    Object.assign(this, props);
  }

  isActive(): boolean {
    return this.state === TransactionTypeState.ACTIVE;
  }

  isBothParticipantsRequired(): boolean {
    return this.participants === TransactionTypeParticipants.BOTH;
  }

  isOwnerParticipantsRequired(): boolean {
    return this.participants === TransactionTypeParticipants.OWNER;
  }

  isBeneficiaryParticipantsRequired(): boolean {
    return this.participants === TransactionTypeParticipants.BENEFICIARY;
  }
}
