import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { BankingTedModel } from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('BankingTedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([BankingTedModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const bankingTed = await BankingTedFactory.create<BankingTedModel>(
      BankingTedModel.name,
    );
    expect(bankingTed).toBeDefined();
    expect(bankingTed.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
