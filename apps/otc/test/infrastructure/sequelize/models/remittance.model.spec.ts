import { Test, TestingModule } from '@nestjs/testing';
import { RemittanceModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceFactory } from '@zro/test/otc/config';

describe('RemittanceModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const Remittance = await RemittanceFactory.create<RemittanceModel>(
      RemittanceModel.name,
    );

    expect(Remittance).toBeDefined();
    expect(Remittance.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
