import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyCreditDepositModel } from '@zro/api-jdpi/infrastructure';
import { NotifyCreditDepositFactory } from '@zro/test/api-jdpi/config';

describe('NotifyCreditDepositModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jdpi.env'] }),
        DatabaseModule.forFeature([NotifyCreditDepositModel]),
      ],
    }).compile();
  });

  it('TC0001 - Module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - Props should be defined', async () => {
    const notifyCreditDeposit =
      await NotifyCreditDepositFactory.create<NotifyCreditDepositModel>(
        NotifyCreditDepositModel.name,
      );

    expect(notifyCreditDeposit).toBeDefined();
    expect(notifyCreditDeposit.id).toBeDefined();
    expect(notifyCreditDeposit.externalId).toBeDefined();
    expect(notifyCreditDeposit.endToEndId).toBeDefined();
    expect(notifyCreditDeposit.initiationType).toBeDefined();
    expect(notifyCreditDeposit.paymentPriorityType).toBeDefined();
    expect(notifyCreditDeposit.paymentPriorityLevelType).toBeDefined();
    expect(notifyCreditDeposit.finalityType).toBeDefined();
    expect(notifyCreditDeposit.thirdPartIspb).toBeDefined();
    expect(notifyCreditDeposit.thirdPartPersonType).toBeDefined();
    expect(notifyCreditDeposit.thirdPartDocument).toBeDefined();
    expect(notifyCreditDeposit.thirdPartAccountType).toBeDefined();
    expect(notifyCreditDeposit.thirdPartAccountNumber).toBeDefined();
    expect(notifyCreditDeposit.thirdPartName).toBeDefined();
    expect(notifyCreditDeposit.clientIspb).toBeDefined();
    expect(notifyCreditDeposit.clientPersonType).toBeDefined();
    expect(notifyCreditDeposit.clientDocument).toBeDefined();
    expect(notifyCreditDeposit.clientAccountType).toBeDefined();
    expect(notifyCreditDeposit.clientAccountNumber).toBeDefined();
    expect(notifyCreditDeposit.amount).toBeDefined();
    expect(notifyCreditDeposit.createdAt).toBeDefined();
    expect(notifyCreditDeposit.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
