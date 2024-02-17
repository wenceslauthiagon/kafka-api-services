import { Test, TestingModule } from '@nestjs/testing';

import { SpreadModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadFactory } from '@zro/test/otc/config';

describe('SpreadModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const result = await SpreadFactory.create<SpreadModel>(SpreadModel.name);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.buy).toBeDefined();
    expect(result.buyFloat).toBeDefined();
    expect(result.sell).toBeDefined();
    expect(result.sellFloat).toBeDefined();
    expect(result.offMarketBuy).toBeDefined();
    expect(result.offMarketSell).toBeDefined();
    expect(result.offMarketTimeStart).toBeDefined();
    expect(result.offMarketTimeEnd).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
