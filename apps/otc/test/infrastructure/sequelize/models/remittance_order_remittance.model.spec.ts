import { Test, TestingModule } from '@nestjs/testing';
import { RemittanceOrderRemittanceModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceOrderRemittanceFactory } from '@zro/test/otc/config';

describe('RemittanceOrderRemittanceModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const RemittanceOrderRemittance =
      await RemittanceOrderRemittanceFactory.create<RemittanceOrderRemittanceModel>(
        RemittanceOrderRemittanceModel.name,
      );
    expect(RemittanceOrderRemittance).toBeDefined();
    expect(RemittanceOrderRemittance.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
