import { Test, TestingModule } from '@nestjs/testing';
import { TaxModel } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { TaxFactory } from '@zro/test/quotations/config';

describe('TaxModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const tax = await TaxFactory.create<TaxModel>(TaxModel.name);
    expect(tax).toBeDefined();
    expect(tax.id).toBeDefined();
    expect(tax.value).toBeDefined();
    expect(tax.valueFloat).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
