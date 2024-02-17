import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  CreateAndAcceptExchangeQuotationNestObserver as Observer,
  RemittanceDatabaseRepository,
  RemittanceModel,
} from '@zro/otc/infrastructure';
import { RemittanceRepository, RemittanceStatus } from '@zro/otc/domain';
import { RemittanceFactory } from '@zro/test/otc/config';
import { HandleCreateAndAcceptExchangeQuotationEventRequest } from '@zro/otc/interface';

describe('CreateFailedExchangeQuotationNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let remittanceRepository: RemittanceRepository;

  const currencyTag = 'USD';

  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    observer = module.get<Observer>(Observer);
    remittanceRepository = new RemittanceDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should return status for remittance when deadLetter successfully.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.WAITING },
      );

      const message: HandleCreateAndAcceptExchangeQuotationEventRequest = {
        remittanceIds: [remittance.id],
        currencyTag,
        sendDate: new Date(),
        receiveDate: new Date(),
      };

      await observer.handleCreateAndAcceptExchangeQuotationDeadLetterEventViaTopazio(
        message,
        remittanceRepository,
        logger,
      );

      const found = await RemittanceModel.findOne({
        where: { id: remittance.id },
      });

      expect(found.status).toEqual(RemittanceStatus.OPEN);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
