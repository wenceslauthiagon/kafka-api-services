import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { KeyState, PixKey, KeyType } from './pix_key.entity';

/**
 * Register all states history for pik key.
 */
export type FilterWhere = GetPixKeyHistoryFilter;

export type GetPixKeyFilter = {
  key?: string;
  type?: KeyType;
  userId?: string;
};

export type GetDateFilter = {
  start: Date;
  end: Date;
};

export type GetPixKeyHistoryFilter = {
  pixKeyId?: string;
  pixKey?: GetPixKeyFilter;
  state?: KeyState;
  createdAt?: GetDateFilter;
  updatedAt?: GetDateFilter;
};

export interface PixKeyHistory extends Domain<string> {
  pixKey: PixKey;
  state: KeyState;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export class PixKeyHistoryEntity implements PixKeyHistory {
  id?: string;
  pixKey: PixKey;
  state: KeyState;
  createdAt: Date;
  updatedAt: Date;
  user: User;

  constructor(props: Partial<PixKeyHistory>) {
    Object.assign(this, props);
  }
}
