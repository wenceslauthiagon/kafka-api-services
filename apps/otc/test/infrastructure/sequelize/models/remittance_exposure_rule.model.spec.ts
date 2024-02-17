import { Test, TestingModule } from '@nestjs/testing';
import { RemittanceExposureRuleModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';

describe('RemittanceExposureRuleModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const remittanceExposureRule =
      await RemittanceExposureRuleFactory.create<RemittanceExposureRuleModel>(
        RemittanceExposureRuleModel.name,
      );
    expect(remittanceExposureRule).toBeDefined();
    expect(remittanceExposureRule.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
