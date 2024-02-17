import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, TranslateService } from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDevolutionEntity,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import { JdpiAccountType, JdpiPersonType } from '@zro/jdpi/domain';
import {
  FailedNotifyCreditDatabaseRepository,
  NotifyCreditDevolutionDatabaseRepository,
  NotifyCreditDevolutionJdpiNestObserver as Observer,
  PixPaymentServiceKafka,
} from '@zro/api-jdpi/infrastructure';
import { HandleNotifyCreditDevolutionJdpiEventRequest } from '@zro/api-jdpi/interface';
import { AppModule } from '@zro/api-jdpi/infrastructure/nest/modules/app.module';
import { NotifyCreditDevolutionFactory } from '@zro/test/api-jdpi/config';

describe('NotifyCreditDevolutionJdpiNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository;
  let failedNotifyCreditRepository: FailedNotifyCreditRepository;

  const pixPaymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();
  const mockReceivePixDepositService: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.receivePixDeposit),
  );
  const mockReceivePixDevolutionService: jest.Mock = On(pixPaymentService).get(
    method((mock) => mock.receivePixDevolution),
  );

  const translateService: TranslateService = createMock<TranslateService>();
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TranslateService)
      .useValue(translateService)
      .compile();

    controller = module.get<Observer>(Observer);
    notifyCreditDevolutionRepository =
      new NotifyCreditDevolutionDatabaseRepository();
    failedNotifyCreditRepository = new FailedNotifyCreditDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCreditDevolutionEventViaPixPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify credit devolution successfully', async () => {
        const data =
          await NotifyCreditDevolutionFactory.create<NotifyCreditDevolutionEntity>(
            NotifyCreditDevolutionEntity.name,
          );

        const message: HandleNotifyCreditDevolutionJdpiEventRequest = {
          externalId: data.externalId,
          originalEndToEndId: data.originalEndToEndId,
          devolutionEndToEndId: data.devolutionEndToEndId,
          devolutionCode: data.devolutionCode,
          thirdPartIspb: data.thirdPartIspb,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartPersonType: JdpiPersonType.NATURAL_PERSON,
          thirdPartAccountType: JdpiAccountType.CACC,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          thirdPartName: data.thirdPartName,
          clientIspb: data.clientIspb,
          clientPersonType: JdpiPersonType.NATURAL_PERSON,
          clientAccountType: JdpiAccountType.CACC,
          clientAccountNumber: data.clientAccountNumber,
          clientDocument: data.clientDocument,
          createdAt: data.createdAt,
          amount: data.amount,
        };

        const spyRepositoryCreate = jest.spyOn(
          notifyCreditDevolutionRepository,
          'create',
        );

        await controller.handleNotifyCreditDevolutionEventViaPixPayment(
          message,
          logger,
          failedNotifyCreditRepository,
          notifyCreditDevolutionRepository,
          pixPaymentService,
          ctx,
        );

        expect(spyRepositoryCreate).toHaveBeenCalledTimes(1);
        expect(mockReceivePixDepositService).toHaveBeenCalledTimes(0);
        expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
