import { Domain } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import { KeyType } from './pix_key.entity';

export enum ClaimReasonType {
  FRAUD = 'FRAUD',
  USER_REQUESTED = 'USER_REQUESTED',
  ACCOUNT_CLOSURE = 'ACCOUNT_CLOSURE',
  DEFAULT_OPERATION = 'DEFAULT_OPERATION',
}

export enum ClaimStatusType {
  OPEN = 'OPEN',
  WAITING_RESOLUTION = 'WAITING_RESOLUTION',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ClaimType {
  OWNERSHIP = 'OWNERSHIP',
  PORTABILITY = 'PORTABILITY',
}

export interface PixKeyClaim extends Domain<string> {
  keyType: KeyType;
  key: string;
  type: ClaimType;
  status: ClaimStatusType;
  ispb: string;
  document?: string;
  branch?: string;
  accountNumber?: string;
  personType?: PersonType;
  finalResolutionDate?: Date;
  finalCompleteDate?: Date;
  lastChangeDate?: Date;
  claimOpeningDate?: Date;
  claimClosingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PixKeyClaimEntity implements PixKeyClaim {
  id: string;
  keyType: KeyType;
  key: string;
  type: ClaimType;
  status: ClaimStatusType;
  ispb: string;
  document?: string;
  branch?: string;
  accountNumber?: string;
  personType?: PersonType;
  finalResolutionDate?: Date;
  finalCompleteDate?: Date;
  lastChangeDate?: Date;
  claimOpeningDate?: Date;
  claimClosingDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixKeyClaim>) {
    Object.assign(this, props);
  }
}
