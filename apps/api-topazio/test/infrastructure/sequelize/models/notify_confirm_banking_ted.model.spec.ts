import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyConfirmBankingTedModel } from '@zro/api-topazio/infrastructure';
import { NotifyConfirmBankingTedFactory } from '@zro/test/api-topazio/config';

describe('NotifyConfirmBankingTedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyConfirmBankingTedModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyConfirmBankingTed =
      await NotifyConfirmBankingTedFactory.create<NotifyConfirmBankingTedModel>(
        NotifyConfirmBankingTedModel.name,
      );
    expect(notifyConfirmBankingTed).toBeDefined();
    expect(notifyConfirmBankingTed.transactionId).toBeDefined();
  });

  afterAll(() => module.close());
});
