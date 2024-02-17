import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyInfractionModel } from '@zro/api-topazio/infrastructure';
import { NotifyInfractionFactory } from '@zro/test/api-topazio/config';

describe('NotifyInfractionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyInfractionModel]),
      ],
    }).compile();
  });

  it('TC0001 - module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - props should be defined', async () => {
    const notifyInfraction =
      await NotifyInfractionFactory.create<NotifyInfractionModel>(
        NotifyInfractionModel.name,
      );

    expect(notifyInfraction).toBeDefined();
    expect(notifyInfraction.id).toBeDefined();
    expect(notifyInfraction.infractionId).toBeDefined();
    expect(notifyInfraction.operationTransactionId).toBeDefined();
    expect(notifyInfraction.ispb).toBeDefined();
    expect(notifyInfraction.endToEndId).toBeDefined();
    expect(notifyInfraction.infractionType).toBeDefined();
    expect(notifyInfraction.reportedBy).toBeDefined();
    expect(notifyInfraction.reportDetails).toBeDefined();
    expect(notifyInfraction.status).toBeDefined();
    expect(notifyInfraction.debitedParticipant).toBeDefined();
    expect(notifyInfraction.creditedParticipant).toBeDefined();
    expect(notifyInfraction.creationDate).toBeDefined();
    expect(notifyInfraction.lastChangeDate).toBeDefined();
    expect(notifyInfraction.analysisResult).toBeDefined();
    expect(notifyInfraction.analysisDetails).toBeDefined();
    expect(notifyInfraction.isReporter).toBeDefined();
    expect(notifyInfraction.closingDate).toBeDefined();
    expect(notifyInfraction.cancellationDate).toBeDefined();
    expect(notifyInfraction.state).toBeDefined();
    expect(notifyInfraction.createdAt).toBeDefined();
    expect(notifyInfraction.updatedAt).toBeDefined();
  });

  afterAll(() => module.close());
});
