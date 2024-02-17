import { Test, TestingModule } from '@nestjs/testing';
import { ReferralRewardModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { ReferralRewardFactory } from '@zro/test/users/config';

describe('ReferralRewardModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const referralReward =
      await ReferralRewardFactory.create<ReferralRewardModel>(
        ReferralRewardModel.name,
      );

    expect(referralReward).toBeDefined();
    expect(referralReward.id).toBeDefined();
    expect(referralReward.awardedById).toBeDefined();
    expect(referralReward.awardedToUuid).toBeDefined();
    expect(referralReward.operationId).toBeDefined();
    expect(referralReward.amount).toBeDefined();
    expect(referralReward.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
