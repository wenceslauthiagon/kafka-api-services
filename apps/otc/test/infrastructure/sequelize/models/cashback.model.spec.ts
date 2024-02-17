import { Test, TestingModule } from '@nestjs/testing';
import { CashbackModel } from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { CashbackFactory } from '@zro/test/otc/config';

describe('Cashback', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const cashback = await CashbackFactory.create<CashbackModel>(
      CashbackModel.name,
    );
    expect(cashback).toBeDefined();
    expect(cashback.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
