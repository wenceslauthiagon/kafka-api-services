import { Domain } from '@zro/common';
import { User } from './user.entity';

export interface UserOnboarding extends Domain<number> {
  user: User;
}

export class UserOnboardingEntity implements UserOnboarding {
  user: User;

  constructor(props: Partial<UserOnboarding> = {}) {
    Object.assign(this, props);
  }
}
