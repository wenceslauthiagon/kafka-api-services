import { Test, TestingModule } from '@nestjs/testing';
import { QuotationModel } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('QuotationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const quotation = await QuotationFactory.create<QuotationModel>(
      QuotationModel.name,
    );
    expect(quotation).toBeDefined();
    expect(quotation.id).toBeDefined();
    expect(quotation.streamQuotation).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
