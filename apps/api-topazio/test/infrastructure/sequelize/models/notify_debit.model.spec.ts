import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyDebitModel } from '@zro/api-topazio/infrastructure';
import { NotifyDebitFactory } from '@zro/test/api-topazio/config';

describe('NotifyDebitModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyDebitModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyDebit = await NotifyDebitFactory.create<NotifyDebitModel>(
      NotifyDebitModel.name,
    );
    expect(notifyDebit).toBeDefined();
    expect(notifyDebit.transactionId).toBeDefined();
  });

  afterAll(() => module.close());
});
