import { Test, TestingModule } from '@nestjs/testing';
import { PixInfractionModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('InfractionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const infraction = await InfractionFactory.create<PixInfractionModel>(
      PixInfractionModel.name,
    );

    expect(infraction).toBeDefined();
    expect(infraction.id).toBeDefined();
    expect(infraction.issueId).toBeDefined();
    expect(infraction.infractionPspId).toBeDefined();
    expect(infraction.operationId).toBeDefined();
    expect(infraction.transactionId).toBeDefined();
    expect(infraction.transactionType).toBeDefined();
    expect(infraction.description).toBeDefined();
    expect(infraction.infractionType).toBeDefined();
    expect(infraction.status).toBeDefined();
    expect(infraction.state).toBeDefined();
    expect(infraction.analysisResult).toBeDefined();
    expect(infraction.reportBy).toBeDefined();
    expect(infraction.ispbDebitedParticipant).toBeDefined();
    expect(infraction.ispbCreditedParticipant).toBeDefined();
    expect(infraction.ispb).toBeDefined();
    expect(infraction.endToEndId).toBeDefined();
    expect(infraction.ispb).toBeDefined();
    expect(infraction.endToEndId).toBeDefined();
    expect(infraction.creationDate).toBeDefined();
    expect(infraction.lastChangeDate).toBeDefined();
    expect(infraction.analysisDetails).toBeDefined();
    expect(infraction.isReporter).toBeDefined();
    expect(infraction.closingDate).toBeDefined();
    expect(infraction.cancellationDate).toBeDefined();
    expect(infraction.createdAt).toBeDefined();
    expect(infraction.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
