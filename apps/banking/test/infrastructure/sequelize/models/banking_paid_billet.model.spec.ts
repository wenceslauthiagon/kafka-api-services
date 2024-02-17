import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankingPaidBilletModel } from '@zro/banking/infrastructure';
import { BankingPaidBilletFactory } from '@zro/test/banking/config';

describe('BankingPaidBilletModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankingPaidBilletModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const bankingPaidBillet =
      await BankingPaidBilletFactory.create<BankingPaidBilletModel>(
        BankingPaidBilletModel.name,
      );
    expect(bankingPaidBillet).toBeDefined();
    expect(bankingPaidBillet.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
