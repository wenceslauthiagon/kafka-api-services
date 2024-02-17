import { Domain } from '@zro/common';
import { LimitTypePeriodStart, UserLimit } from '@zro/operations/domain';

export interface UserLimitTracker extends Domain<string> {
  userLimit: UserLimit;
  periodStart: LimitTypePeriodStart;
  usedDailyLimit?: number;
  usedMonthlyLimit?: number;
  usedAnnualLimit?: number;
  usedNightlyLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserLimitTrackerEntity implements UserLimitTracker {
  id: string;
  userLimit: UserLimit;
  periodStart: LimitTypePeriodStart;
  usedDailyLimit?: number;
  usedMonthlyLimit?: number;
  usedAnnualLimit?: number;
  usedNightlyLimit?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserLimitTracker>) {
    Object.assign(this, props);
  }
}
