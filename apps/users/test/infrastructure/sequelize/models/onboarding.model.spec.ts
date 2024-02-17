import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OnboardingFactory } from '@zro/test/users/config';

describe('OnboardingModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const onboarding = await OnboardingFactory.create<OnboardingModel>(
      OnboardingModel.name,
    );
    expect(onboarding).toBeDefined();
    expect(onboarding.id).toBeDefined();
    expect(onboarding.status).toBeDefined();
    expect(onboarding.fullName).toBeDefined();
    expect(onboarding.accountNumber).toBeDefined();
    expect(onboarding.branch).toBeDefined();
    expect(onboarding.createdAt).toBeDefined();
    expect(onboarding.updatedAt).toBeDefined();
    expect(onboarding.discardedAt).toBeNull();
  });

  afterAll(async () => {
    await module.close();
  });
});
