import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export interface UserPixKeyDecodeLimit extends Domain<string> {
  user: User;
  limit: number;
  lastDecodedCreatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPixKeyDecodeLimitEntity implements UserPixKeyDecodeLimit {
  id: string;
  limit: number;
  user: User;
  lastDecodedCreatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserPixKeyDecodeLimit>) {
    Object.assign(this, props);
  }
}
