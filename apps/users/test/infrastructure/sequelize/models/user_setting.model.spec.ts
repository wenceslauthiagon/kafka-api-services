import { Test, TestingModule } from '@nestjs/testing';
import { UserSettingModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserSettingFactory } from '@zro/test/users/config';

describe('UserSettingModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userSetting = await UserSettingFactory.create<UserSettingModel>(
      UserSettingModel.name,
    );
    expect(userSetting).toBeDefined();
    expect(userSetting.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
