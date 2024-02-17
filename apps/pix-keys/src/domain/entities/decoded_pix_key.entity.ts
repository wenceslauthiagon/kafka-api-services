import { Domain } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { User, PersonType } from '@zro/users/domain';
import { KeyType } from './pix_key.entity';

export enum DecodedPixKeyState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
}

export interface DecodedPixKey extends Domain<string> {
  type: KeyType;
  key: string;
  personType?: PersonType;
  document?: string;
  name?: string;
  tradeName?: string;
  accountNumber?: string;
  accountType?: AccountType;
  branch?: string;
  ispb: string;
  activeAccount?: boolean;
  accountOpeningDate?: Date;
  keyCreationDate?: Date;
  keyOwnershipDate?: Date;
  claimRequestDate?: Date;
  endToEndId?: string;
  cidId?: string;
  dictAccountId?: number;
  state: DecodedPixKeyState;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export class DecodedPixKeyEntity implements DecodedPixKey {
  id: string;
  type: KeyType;
  key: string;
  personType?: PersonType;
  document?: string;
  name?: string;
  tradeName?: string;
  accountNumber?: string;
  branch?: string;
  ispb: string;
  accountType?: AccountType;
  activeAccount?: boolean;
  accountOpeningDate?: Date;
  keyCreationDate?: Date;
  keyOwnershipDate?: Date;
  claimRequestDate?: Date;
  endToEndId?: string;
  cidId?: string;
  dictAccountId?: number;
  state: DecodedPixKeyState;
  user: User;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<DecodedPixKey>) {
    Object.assign(this, props);
  }
}
