import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankingTedReceivedModel } from '@zro/banking/infrastructure';
import { BankingTedReceivedFactory } from '@zro/test/banking/config';

describe('BankingTedReceivedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankingTedReceivedModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const bankingTedReceived =
      await BankingTedReceivedFactory.create<BankingTedReceivedModel>(
        BankingTedReceivedModel.name,
      );
    expect(bankingTedReceived).toBeDefined();
    expect(bankingTedReceived.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
