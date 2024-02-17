import { Test, TestingModule } from '@nestjs/testing';
import { FeatureSettingModel } from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import { FeatureSettingFactory } from '@zro/test/utils/config';

describe('FeatureSetting', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - Should be defined', async () => {
    const featureSetting =
      await FeatureSettingFactory.create<FeatureSettingModel>(
        FeatureSettingModel.name,
      );

    expect(featureSetting).toBeDefined();
    expect(featureSetting.id).toBeDefined();
    expect(featureSetting.name).toBeDefined();
    expect(featureSetting.state).toBeDefined();
    expect(featureSetting.createdAt).toBeDefined();
    expect(featureSetting.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
