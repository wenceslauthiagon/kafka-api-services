import { Test, TestingModule } from '@nestjs/testing';
import { RemittanceExchangeQuotationModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceExchangeQuotationFactory } from '@zro/test/otc/config';

describe('RemittanceExchangeQuotationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const exchangeQuotation =
      await RemittanceExchangeQuotationFactory.create<RemittanceExchangeQuotationModel>(
        RemittanceExchangeQuotationModel.name,
      );

    expect(exchangeQuotation).toBeDefined();
    expect(exchangeQuotation.id).toBeDefined();
    expect(exchangeQuotation.remittanceId).toBeDefined();
    expect(exchangeQuotation.exchangeQuotationId).toBeDefined();
    expect(exchangeQuotation.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
