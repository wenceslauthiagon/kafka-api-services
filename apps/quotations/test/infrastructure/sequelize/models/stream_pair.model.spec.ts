import { Test, TestingModule } from '@nestjs/testing';
import { StreamPairModel } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { StreamPairFactory } from '@zro/test/quotations/config';

describe('StreamPairModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const quotation = await StreamPairFactory.create<StreamPairModel>(
      StreamPairModel.name,
    );
    expect(quotation).toBeDefined();
    expect(quotation.id).toBeDefined();
    expect(quotation.gatewayName).toBeDefined();
    expect(quotation.priority).toBeDefined();
    expect(quotation.active).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
