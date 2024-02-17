import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';

export interface ReferralReward extends Domain<number> {
  awardedTo: User;
  awardedBy: User;
  amount: number;
  operation: Operation;
  paymentOperation?: Operation;
  group?: string;
  createdAt?: Date;
}

export class ReferralRewardEntity implements ReferralReward {
  id: number;
  awardedTo: User;
  awardedBy: User;
  amount: number;
  operation: Operation;
  paymentOperation?: Operation;
  group?: string;
  createdAt?: Date;

  constructor(props: Partial<ReferralReward>) {
    Object.assign(this, props);
  }
}
