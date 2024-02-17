import { Test, TestingModule } from '@nestjs/testing';
import { UserWithdrawSettingRequestModel } from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('UserWithdrawSettingRequestModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - Should be defined', async () => {
    const userWithdrawSettingRequest =
      await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
        UserWithdrawSettingRequestModel.name,
      );

    expect(userWithdrawSettingRequest).toBeDefined();
    expect(userWithdrawSettingRequest.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
