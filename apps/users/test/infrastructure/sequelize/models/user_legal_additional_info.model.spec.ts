import { Test, TestingModule } from '@nestjs/testing';
import { UserLegalAdditionalInfoModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserLegalAdditionalInfoFactory } from '@zro/test/users/config';

describe('UserLegalAdditionalInfoModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const UserLegalAdditionalInfo =
      await UserLegalAdditionalInfoFactory.create<UserLegalAdditionalInfoModel>(
        UserLegalAdditionalInfoModel.name,
      );

    expect(UserLegalAdditionalInfo).toBeDefined();
    expect(UserLegalAdditionalInfo.id).toBeDefined();
    expect(UserLegalAdditionalInfo.createdAt).toBeDefined();
    expect(UserLegalAdditionalInfo.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
