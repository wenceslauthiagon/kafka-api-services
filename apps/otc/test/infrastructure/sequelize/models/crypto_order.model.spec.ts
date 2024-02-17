import { Test, TestingModule } from '@nestjs/testing';
import { CryptoOrderModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { CryptoOrderFactory } from '@zro/test/otc/config';

describe('CryptoOrder', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const criptoOrders = await CryptoOrderFactory.create<CryptoOrderModel>(
      CryptoOrderModel.name,
    );
    expect(criptoOrders).toBeDefined();
    expect(criptoOrders.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
