import { Test, TestingModule } from '@nestjs/testing';
import { UserModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';

describe('UserModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
