import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyRegisterBankingTedModel } from '@zro/api-topazio/infrastructure';
import { NotifyRegisterBankingTedFactory } from '@zro/test/api-topazio/config';

describe('NotifyRegisterBankingTedModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyRegisterBankingTedModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyRegisterBankingTed =
      await NotifyRegisterBankingTedFactory.create<NotifyRegisterBankingTedModel>(
        NotifyRegisterBankingTedModel.name,
      );
    expect(notifyRegisterBankingTed).toBeDefined();
    expect(notifyRegisterBankingTed.transactionId).toBeDefined();
  });

  afterAll(() => module.close());
});
