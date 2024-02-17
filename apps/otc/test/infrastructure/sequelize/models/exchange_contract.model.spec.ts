import { Test, TestingModule } from '@nestjs/testing';

import { ExchangeContractModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';

describe('ExchangeContractModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const exchangeContract =
      await ExchangeContractFactory.create<ExchangeContractModel>(
        ExchangeContractModel.name,
      );

    expect(exchangeContract).toBeDefined();
    expect(exchangeContract.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
