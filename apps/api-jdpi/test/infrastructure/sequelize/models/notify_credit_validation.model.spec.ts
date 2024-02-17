import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyCreditValidationModel } from '@zro/api-jdpi/infrastructure';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';

describe('NotifyCreditValidationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jdpi.env'] }),
        DatabaseModule.forFeature([NotifyCreditValidationModel]),
      ],
    }).compile();
  });

  it('TC0001 - Module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - Props should be defined', async () => {
    const notifyCreditValidation =
      await NotifyCreditValidationFactory.create<NotifyCreditValidationModel>(
        NotifyCreditValidationModel.name,
      );

    expect(notifyCreditValidation).toBeDefined();
    expect(notifyCreditValidation.initiationType).toBeDefined();
    expect(notifyCreditValidation.paymentPriorityType).toBeDefined();
    expect(notifyCreditValidation.paymentPriorityLevelType).toBeDefined();
    expect(notifyCreditValidation.finalityType).toBeDefined();
    expect(notifyCreditValidation.thirdPartIspb).toBeDefined();
    expect(notifyCreditValidation.thirdPartPersonType).toBeDefined();
    expect(notifyCreditValidation.thirdPartDocument).toBeDefined();
    expect(notifyCreditValidation.thirdPartAccountType).toBeDefined();
    expect(notifyCreditValidation.thirdPartAccountNumber).toBeDefined();
    expect(notifyCreditValidation.thirdPartName).toBeDefined();
    expect(notifyCreditValidation.clientIspb).toBeDefined();
    expect(notifyCreditValidation.clientPersonType).toBeDefined();
    expect(notifyCreditValidation.clientDocument).toBeDefined();
    expect(notifyCreditValidation.clientAccountType).toBeDefined();
    expect(notifyCreditValidation.clientAccountNumber).toBeDefined();
    expect(notifyCreditValidation.amount).toBeDefined();
    expect(notifyCreditValidation.state).toBeDefined();
    expect(notifyCreditValidation.responseResultType).toBeDefined();
    expect(notifyCreditValidation.responseCreatedAt).toBeDefined();
    expect(notifyCreditValidation.createdAt).toBeDefined();
    expect(notifyCreditValidation.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
