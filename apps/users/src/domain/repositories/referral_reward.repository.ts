import { ReferralReward } from '@zro/users/domain';

export interface ReferralRewardRepository {
  create: (referralReward: ReferralReward) => Promise<ReferralReward>;
  update(referralReward: ReferralReward): Promise<ReferralReward>;
  getById: (id: number) => Promise<ReferralReward>;
  getByPaymentOperationIsNull: () => Promise<ReferralReward[]>;
  getByPaymentOperationIsNullAndCreatedAtStartAndCreatedAtEnd: (
    createdAtStart: Date,
    createdAtEnd: Date,
  ) => Promise<ReferralReward[]>;
}
