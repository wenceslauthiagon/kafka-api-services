import { Domain } from '@zro/common';

/**
 * User.
 */
export interface User extends Domain<number> {
  name: string;
  email: string;
  password: string;
  emailVerifiedAt?: Date;
  rememberToken?: string;
  phone?: string;
  office?: string;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string;
  twoFactorConfirmedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class UserEntity implements User {
  id: number;
  name: string;
  email: string;
  password: string;
  emailVerifiedAt?: Date;
  rememberToken?: string;
  phone?: string;
  office?: string;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string;
  twoFactorConfirmedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(props: Partial<User>) {
    Object.assign(this, props);
  }
}
