import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyCreditDevolutionModel } from '@zro/api-jdpi/infrastructure';
import { NotifyCreditDevolutionFactory } from '@zro/test/api-jdpi/config';

describe('NotifyCreditDevolutionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-jdpi.env'] }),
        DatabaseModule.forFeature([NotifyCreditDevolutionModel]),
      ],
    }).compile();
  });

  it('TC0001 - Module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - Props should be defined', async () => {
    const notifyCreditDevolution =
      await NotifyCreditDevolutionFactory.create<NotifyCreditDevolutionModel>(
        NotifyCreditDevolutionModel.name,
      );

    expect(notifyCreditDevolution).toBeDefined();
    expect(notifyCreditDevolution.id).toBeDefined();
    expect(notifyCreditDevolution.externalId).toBeDefined();
    expect(notifyCreditDevolution.originalEndToEndId).toBeDefined();
    expect(notifyCreditDevolution.devolutionEndToEndId).toBeDefined();
    expect(notifyCreditDevolution.devolutionCode).toBeDefined();
    expect(notifyCreditDevolution.thirdPartIspb).toBeDefined();
    expect(notifyCreditDevolution.thirdPartPersonType).toBeDefined();
    expect(notifyCreditDevolution.thirdPartDocument).toBeDefined();
    expect(notifyCreditDevolution.thirdPartAccountType).toBeDefined();
    expect(notifyCreditDevolution.thirdPartAccountNumber).toBeDefined();
    expect(notifyCreditDevolution.thirdPartName).toBeDefined();
    expect(notifyCreditDevolution.clientIspb).toBeDefined();
    expect(notifyCreditDevolution.clientPersonType).toBeDefined();
    expect(notifyCreditDevolution.clientDocument).toBeDefined();
    expect(notifyCreditDevolution.clientAccountType).toBeDefined();
    expect(notifyCreditDevolution.clientAccountNumber).toBeDefined();
    expect(notifyCreditDevolution.amount).toBeDefined();
    expect(notifyCreditDevolution.createdAt).toBeDefined();
    expect(notifyCreditDevolution.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
