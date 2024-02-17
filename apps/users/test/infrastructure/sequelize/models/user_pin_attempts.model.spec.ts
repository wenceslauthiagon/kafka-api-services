import { Test, TestingModule } from '@nestjs/testing';
import { UserPinAttemptsModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserPinAttemptsFactory } from '@zro/test/users/config';

describe('UserPinAttemptsModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userPinAttempts =
      await UserPinAttemptsFactory.create<UserPinAttemptsModel>(
        UserPinAttemptsModel.name,
      );
    expect(userPinAttempts).toBeDefined();
    expect(userPinAttempts.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
