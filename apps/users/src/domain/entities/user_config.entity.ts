import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export enum UserConfigName {
  SHOW_THIRD_PART_CPF = 'show_third_part_cpf',
}

export enum UserConfigState {
  ACTIVE = 'ACTIVE',
  DEACTIVE = 'DEACTIVE',
}

export interface UserConfig extends Domain<string> {
  user: User;
  name: UserConfigName;
  state: UserConfigState;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserConfigEntity implements UserConfig {
  id!: string;
  user!: User;
  name!: UserConfigName;
  state: UserConfigState;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<UserConfig>) {
    Object.assign(this, props);
  }
}
