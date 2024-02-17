import { Domain } from '@zro/common';
import { User } from './user.entity';

export type UserForgotPasswordId = UserForgotPassword['id'];

export enum UserForgotPasswordState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export interface UserForgotPassword extends Domain<string> {
  id: string;
  state: UserForgotPasswordState;
  user: User;
  phoneNumber?: string;
  email?: string;
  code: string;
  attempts: number;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;

  isAlreadyConfirmed(): boolean;
  isAlreadyInvalid(): boolean;
}

export class UserForgotPasswordEntity implements UserForgotPassword {
  id: string;
  state: UserForgotPasswordState;
  user: User;
  phoneNumber?: string;
  email?: string;
  code: string;
  attempts: number;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;

  isAlreadyConfirmed(): boolean {
    return [UserForgotPasswordState.CONFIRMED].includes(this.state);
  }

  isAlreadyInvalid(): boolean {
    return [
      UserForgotPasswordState.DECLINED,
      UserForgotPasswordState.EXPIRED,
    ].includes(this.state);
  }

  constructor(props: Partial<UserForgotPassword>) {
    Object.assign(this, props);
  }
}
