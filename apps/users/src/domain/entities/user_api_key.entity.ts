import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export interface UserApiKey extends Domain<string> {
  user: User;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserApiKeyEntity implements UserApiKey {
  id: string;
  user: User;
  hash: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserApiKey>) {
    Object.assign(this, props);
  }
}
