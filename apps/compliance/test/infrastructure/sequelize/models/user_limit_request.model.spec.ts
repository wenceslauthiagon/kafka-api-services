import { Test, TestingModule } from '@nestjs/testing';
import { UserLimitRequestModel } from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('UserLimitRequestModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - Should be defined', async () => {
    const userLimitRequest =
      await UserLimitRequestFactory.create<UserLimitRequestModel>(
        UserLimitRequestModel.name,
      );

    expect(userLimitRequest).toBeDefined();
    expect(userLimitRequest.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
