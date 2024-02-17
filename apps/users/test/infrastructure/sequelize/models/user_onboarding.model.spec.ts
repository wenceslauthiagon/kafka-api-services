import { Test, TestingModule } from '@nestjs/testing';
import { UserOnboardingModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserOnboardingFactory } from '@zro/test/users/config';

describe('UserOnboardingModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userOnboarding =
      await UserOnboardingFactory.create<UserOnboardingModel>(
        UserOnboardingModel.name,
      );
    expect(userOnboarding).toBeDefined();
    expect(userOnboarding.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
