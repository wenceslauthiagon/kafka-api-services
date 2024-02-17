import { Domain } from '@zro/common';
import { User } from './user.entity';

export interface UserSetting extends Domain<number> {
  user: User;
}

export class UserSettingEntity implements UserSetting {
  user: User;

  constructor(props: Partial<UserSetting> = {}) {
    Object.assign(this, props);
  }
}
