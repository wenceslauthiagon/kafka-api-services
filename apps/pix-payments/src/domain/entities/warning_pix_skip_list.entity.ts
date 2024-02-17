import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

/**
 * WarningPixSkipList.
 */
export interface WarningPixSkipList extends Domain<string> {
  user: User;
  clientAccountNumber: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WarningPixSkipListEntity implements WarningPixSkipList {
  id: string;
  user: User;
  clientAccountNumber: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WarningPixSkipList>) {
    Object.assign(this, props);
  }
}
