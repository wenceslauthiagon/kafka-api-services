import { Domain, Failed } from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import { PixKeyClaim } from './pix_key_claim.entity';

export enum KeyType {
  CNPJ = 'CNPJ',
  CPF = 'CPF',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  EVP = 'EVP',
}

export enum KeyState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  NOT_CONFIRMED = 'NOT_CONFIRMED',
  ADD_KEY_READY = 'ADD_KEY_READY',
  READY = 'READY',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  DELETING = 'DELETING',
  DELETED = 'DELETED',
  PORTABILITY_PENDING = 'PORTABILITY_PENDING',
  PORTABILITY_OPENED = 'PORTABILITY_OPENED',
  PORTABILITY_STARTED = 'PORTABILITY_STARTED',
  PORTABILITY_READY = 'PORTABILITY_READY',
  PORTABILITY_CONFIRMED = 'PORTABILITY_CONFIRMED',
  PORTABILITY_CANCELING = 'PORTABILITY_CANCELING',
  PORTABILITY_CANCELED = 'PORTABILITY_CANCELED',
  PORTABILITY_REQUEST_PENDING = 'PORTABILITY_REQUEST_PENDING',
  PORTABILITY_REQUEST_CANCEL_OPENED = 'PORTABILITY_REQUEST_CANCEL_OPENED',
  PORTABILITY_REQUEST_CANCEL_STARTED = 'PORTABILITY_REQUEST_CANCEL_STARTED',
  PORTABILITY_REQUEST_CONFIRM_OPENED = 'PORTABILITY_REQUEST_CONFIRM_OPENED',
  PORTABILITY_REQUEST_CONFIRM_STARTED = 'PORTABILITY_REQUEST_CONFIRM_STARTED',
  PORTABILITY_REQUEST_AUTO_CONFIRMED = 'PORTABILITY_REQUEST_AUTO_CONFIRMED',
  OWNERSHIP_PENDING = 'OWNERSHIP_PENDING',
  OWNERSHIP_OPENED = 'OWNERSHIP_OPENED',
  OWNERSHIP_STARTED = 'OWNERSHIP_STARTED',
  OWNERSHIP_CONFIRMED = 'OWNERSHIP_CONFIRMED',
  OWNERSHIP_READY = 'OWNERSHIP_READY',
  OWNERSHIP_CANCELING = 'OWNERSHIP_CANCELING',
  OWNERSHIP_CANCELED = 'OWNERSHIP_CANCELED',
  OWNERSHIP_WAITING = 'OWNERSHIP_WAITING',
  OWNERSHIP_CONFLICT = 'OWNERSHIP_CONFLICT',
  CLAIM_NOT_CONFIRMED = 'CLAIM_NOT_CONFIRMED',
  CLAIM_PENDING = 'CLAIM_PENDING',
  CLAIM_CLOSING = 'CLAIM_CLOSING',
  CLAIM_DENIED = 'CLAIM_DENIED',
  CLAIM_CLOSED = 'CLAIM_CLOSED',
}

export enum PixKeyReasonType {
  USER_REQUESTED = 'USER_REQUESTED',
  ACCOUNT_CLOSURE = 'ACCOUNT_CLOSURE',
  BRANCH_TRANSFER = 'BRANCH_TRANSFER',
  ENTRY_INACTIVITY = 'ENTRY_INACTIVITY',
  RECONCILIATION = 'RECONCILIATION',
}

export const PixKeyReadyStates = [
  KeyState.READY,
  KeyState.ADD_KEY_READY,
  KeyState.PORTABILITY_READY,
  KeyState.OWNERSHIP_READY,
];

export const PixKeyCanceledStates = [
  KeyState.NOT_CONFIRMED,
  KeyState.PORTABILITY_REQUEST_AUTO_CONFIRMED,
  KeyState.PORTABILITY_REQUEST_CONFIRM_STARTED,
  KeyState.PORTABILITY_CANCELED,
  KeyState.OWNERSHIP_CANCELED,
  KeyState.OWNERSHIP_CONFLICT,
  KeyState.CLAIM_CLOSED,
];

/**
 * PixKey.
 */
export interface PixKey extends Domain<string> {
  type: KeyType;
  key: string;
  personType: PersonType;
  document: string;
  name: string;
  tradeName?: string;
  user: User;
  accountNumber: string;
  branch: string;
  state: KeyState;
  accountOpeningDate: Date;
  code: string;
  failed?: Failed;
  deletedByReason?: PixKeyReasonType;
  claim?: PixKeyClaim;
  createdAt: Date;
  updatedAt?: Date;
  canceledAt?: Date;
  deletedAt?: Date;
  isSendCodeState(): boolean;
  isSendCodeType(): boolean;
  isVerifiedCodeState(): boolean;
  isVerifiedCodeValue(code: string): boolean;
  isCancelValidationState(): boolean;
  isCancelValidationType(): boolean;
  isReadyState(): boolean;
  isCanceledState(): boolean;
}

export class PixKeyEntity implements PixKey {
  id: string;
  type: KeyType;
  key: string;
  personType: PersonType;
  document: string;
  name: string;
  tradeName?: string;
  user: User;
  accountNumber: string;
  branch: string;
  state: KeyState;
  accountOpeningDate: Date;
  code: string;
  failed?: Failed;
  deletedByReason?: PixKeyReasonType;
  claim?: PixKeyClaim;
  createdAt: Date;
  updatedAt?: Date;
  canceledAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<PixKey>) {
    Object.assign(this, props);
  }

  isSendCodeState(): boolean {
    return [KeyState.PENDING, KeyState.CLAIM_PENDING].includes(this.state);
  }

  isSendCodeType(): boolean {
    return [KeyType.EMAIL, KeyType.PHONE].includes(this.type);
  }

  isVerifiedCodeState(): boolean {
    return [KeyState.PENDING, KeyState.CLAIM_PENDING].includes(this.state);
  }

  isVerifiedCodeValue(code: string): boolean {
    return code === this.code;
  }

  isCancelValidationState(): boolean {
    return [KeyState.PENDING, KeyState.CLAIM_PENDING].includes(this.state);
  }

  isCancelValidationType(): boolean {
    return [KeyType.EMAIL, KeyType.PHONE].includes(this.type);
  }

  isReadyState(): boolean {
    return PixKeyReadyStates.includes(this.state);
  }

  isCanceledState(): boolean {
    return PixKeyCanceledStates.includes(this.state);
  }
}
