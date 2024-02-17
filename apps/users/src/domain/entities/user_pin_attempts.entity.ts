import { Domain } from '@zro/common';
import { User } from './user.entity';

export interface UserPinAttempts extends Domain<number> {
  uuid: string;
  user: User;
  attempts: number;
  updatedAt: Date;
}

export class UserPinAttemptsEntity implements UserPinAttempts {
  id: number;
  uuid: string;
  user: User;
  attempts: number;
  updatedAt: Date;

  constructor(props: Partial<UserPinAttempts> = {}) {
    Object.assign(this, props);
  }
}
