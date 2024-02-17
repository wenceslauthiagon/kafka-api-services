import { Test, TestingModule } from '@nestjs/testing';
import { SignupModel } from '@zro/signup/infrastructure';
import { AppModule } from '@zro/signup/infrastructure/nest/modules/app.module';
import { SignupFactory } from '@zro/test/signup/config';

describe('SignupModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const signup = await SignupFactory.create<SignupModel>(SignupModel.name);

    expect(signup).toBeDefined();
    expect(signup.id).toBeDefined();
    expect(signup.createdAt).toBeDefined();
    expect(signup.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
