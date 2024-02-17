import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyCreditModel } from '@zro/api-topazio/infrastructure';
import { NotifyCreditFactory } from '@zro/test/api-topazio/config';

describe('NotifyCreditModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyCreditModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyCredit = await NotifyCreditFactory.create<NotifyCreditModel>(
      NotifyCreditModel.name,
    );
    expect(notifyCredit).toBeDefined();
    expect(notifyCredit.transactionId).toBeDefined();
  });

  afterAll(() => module.close());
});
