import { Domain } from '@zro/common';

export enum UserState {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum PersonType {
  NATURAL_PERSON = 'NATURAL_PERSON',
  LEGAL_PERSON = 'LEGAL_PERSON',
}

export enum PersonDocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
}

export enum BankOnboardingState {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete',
}

export interface User extends Domain<number> {
  uuid: string;
  password: string;
  pin: string;
  pinHasCreated: boolean;
  eula: boolean;
  phoneNumber: string;
  fullName?: string;
  document?: string;
  type: PersonType;
  fcmToken: string;
  active: boolean;
  state: UserState;
  props?: { [key: string]: string };
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  confirmCode?: number;
  referredBy?: User;
  referralCode?: string;
  email?: string;
  deletedAt?: Date;
  bankOnboardingState?: BankOnboardingState;
  motherName?: string;
  birthDate?: Date;
  genre?: string;
}

export class UserEntity implements User {
  id: number;
  uuid: string;
  password: string;
  pin: string;
  pinHasCreated: boolean;
  eula: boolean;
  phoneNumber: string;
  fullName?: string;
  document?: string;
  type: PersonType;
  fcmToken: string;
  active: boolean;
  state: UserState;
  props?: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
  name: string; // mandatory
  confirmCode?: number; // telegram_confirm_code
  referredBy?: User; // affiliate program
  referralCode?: string;
  email?: string;
  deletedAt?: Date;
  bankOnboardingState?: BankOnboardingState;
  motherName?: string;
  birthDate?: Date;
  genre?: string;

  constructor(props: Partial<User>) {
    Object.assign(this, props);
  }
}
