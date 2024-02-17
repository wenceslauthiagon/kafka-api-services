import { Test, TestingModule } from '@nestjs/testing';
import { UserLegalRepresentorModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserLegalRepresentorFactory } from '@zro/test/users/config';

describe('UserLegalRepresentorModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userLegalRepresentor =
      await UserLegalRepresentorFactory.create<UserLegalRepresentorModel>(
        UserLegalRepresentorModel.name,
      );

    expect(userLegalRepresentor).toBeDefined();
    expect(userLegalRepresentor.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
