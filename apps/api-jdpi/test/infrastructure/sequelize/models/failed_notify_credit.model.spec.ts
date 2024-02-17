import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { FailedNotifyCreditModel } from '@zro/api-jdpi/infrastructure';
import { FailedNotifyCreditFactory } from '@zro/test/api-jdpi/config';

describe('FailedNotifyCreditModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jdpi.env'] }),
        DatabaseModule.forFeature([FailedNotifyCreditModel]),
      ],
    }).compile();
  });

  it('TC0001 - Module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - Props should be defined', async () => {
    const failedNotifyCredit =
      await FailedNotifyCreditFactory.create<FailedNotifyCreditModel>(
        FailedNotifyCreditModel.name,
      );
    expect(failedNotifyCredit).toBeDefined();
    expect(failedNotifyCredit.externalId).toBeDefined();
    expect(failedNotifyCredit.failedTransactionType).toBeDefined();
  });

  afterAll(() => module.close());
});
