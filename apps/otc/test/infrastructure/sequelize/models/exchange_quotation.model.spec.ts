import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeQuotationModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeQuotationFactory } from '@zro/test/otc/config';

describe('ExchangeQuotationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const exchangeQuotation =
      await ExchangeQuotationFactory.create<ExchangeQuotationModel>(
        ExchangeQuotationModel.name,
      );

    expect(exchangeQuotation).toBeDefined();
    expect(exchangeQuotation.id).toBeDefined();
    expect(exchangeQuotation.quotationPspId).toBeDefined();
    expect(exchangeQuotation.solicitationPspId).toBeDefined();
    expect(exchangeQuotation.quotation).toBeDefined();
    expect(exchangeQuotation.amount).toBeDefined();
    expect(exchangeQuotation.amountExternalCurrency).toBeDefined();
    expect(exchangeQuotation.state).toBeDefined();
    expect(exchangeQuotation.props).toBeDefined();
    expect(exchangeQuotation.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
