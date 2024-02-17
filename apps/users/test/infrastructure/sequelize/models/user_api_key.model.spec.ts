import { Test, TestingModule } from '@nestjs/testing';
import { UserApiKeyModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserApiKeyFactory } from '@zro/test/users/config';

describe('UserApiKeyModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userApiKey = await UserApiKeyFactory.create<UserApiKeyModel>(
      UserApiKeyModel.name,
    );
    expect(userApiKey).toBeDefined();
    expect(userApiKey.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
