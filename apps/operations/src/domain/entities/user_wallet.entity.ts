import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { PermissionType, Wallet } from '@zro/operations/domain';

export interface UserWallet extends Domain<string> {
  user: User;
  wallet: Wallet;
  permissionTypes: PermissionType[];
}

export class UserWalletEntity implements UserWallet {
  id: string;
  user: User;
  wallet: Wallet;
  permissionTypes: PermissionType[];

  constructor(props: Partial<UserWallet>) {
    Object.assign(this, props);
  }
}
