import { Domain } from '@zro/common';
import { User, PersonType } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
import { AccountType } from './payment.entity';

export enum DecodedPixAccountState {
  PENDING = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED_PAYMENT',
}

/**
 * Decoded Pix Account.
 */
export interface DecodedPixAccount extends Domain<string> {
  user: User;
  props?: any;
  name: string;
  tradeName?: string;
  state: DecodedPixAccountState;
  personType: PersonType;
  bank: Bank;
  branch: string;
  accountNumber: string;
  accountType: AccountType;
  document: string;
  createdAt?: Date;
}

export class DecodedPixAccountEntity implements DecodedPixAccount {
  id!: string;
  user!: User;
  props?: any;
  name!: string;
  tradeName?: string;
  state!: DecodedPixAccountState;
  personType!: PersonType;
  bank!: Bank;
  branch!: string;
  accountNumber!: string;
  accountType!: AccountType;
  document!: string;
  createdAt?: Date;

  constructor(props: Partial<DecodedPixAccount>) {
    Object.assign(this, props);
  }
}
