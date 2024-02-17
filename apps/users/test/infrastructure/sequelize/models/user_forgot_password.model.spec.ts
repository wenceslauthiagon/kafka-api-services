import { Test, TestingModule } from '@nestjs/testing';
import { UserForgotPasswordModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserForgotPasswordFactory } from '@zro/test/users/config';

describe('UserForgotPasswordModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userForgotPassword =
      await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
        UserForgotPasswordModel.name,
      );

    expect(userForgotPassword).toBeDefined();
    expect(userForgotPassword.id).toBeDefined();
    expect(userForgotPassword.state).toBeDefined();
    expect(userForgotPassword.userId).toBeDefined();
    expect(userForgotPassword.code).toBeDefined();
    expect(userForgotPassword.phoneNumber).toBeDefined();
    expect(userForgotPassword.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
