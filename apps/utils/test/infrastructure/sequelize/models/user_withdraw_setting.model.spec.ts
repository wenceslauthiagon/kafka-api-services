import { Test, TestingModule } from '@nestjs/testing';
import { UserWithdrawSettingModel } from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('UserWithdrawSettingModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - Should be defined', async () => {
    const userWithdrawSetting =
      await UserWithdrawSettingFactory.create<UserWithdrawSettingModel>(
        UserWithdrawSettingModel.name,
      );

    expect(userWithdrawSetting).toBeDefined();
    expect(userWithdrawSetting.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
