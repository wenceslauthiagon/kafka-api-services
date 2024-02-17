import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankingCashInBilletModel } from '@zro/banking/infrastructure';
import { BankingCashInBilletFactory } from '@zro/test/banking/config';

describe('BankingCashInBilletModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankingCashInBilletModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const bankingCashInBillet =
      await BankingCashInBilletFactory.create<BankingCashInBilletModel>(
        BankingCashInBilletModel.name,
      );
    expect(bankingCashInBillet).toBeDefined();
    expect(bankingCashInBillet.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
