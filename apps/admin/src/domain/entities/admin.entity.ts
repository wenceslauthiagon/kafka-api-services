import { Domain } from '@zro/common';

export interface Admin extends Domain<number> {
  name: string;
  email: string;
  password: string;
  roleId: number;
  active: boolean;
  resetToken: string;
  tokenAttempt: number;
  tokenExpirationTime: Date;
  rrClass: string;
}

export class AdminEntity implements Admin {
  id: number;
  name: string;
  email: string;
  password: string;
  roleId: number;
  active: boolean;
  resetToken: string;
  tokenAttempt: number;
  tokenExpirationTime: Date;
  rrClass: string;

  constructor(props: Partial<Admin>) {
    Object.assign(this, props);
  }
}
