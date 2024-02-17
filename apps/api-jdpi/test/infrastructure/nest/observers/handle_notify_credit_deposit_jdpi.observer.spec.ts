import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, TranslateService } from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDepositEntity,
  NotifyCreditDepositRepository,
} from '@zro/api-jdpi/domain';
import {
  JdpiAccountType,
  JdpiPaymentType,
  JdpiPersonType,
  JdpiPaymentPriorityType,
  JdpiPaymentPriorityLevelType,
} from '@zro/jdpi/domain';
import {
  FailedNotifyCreditDatabaseRepository,
  NotifyCreditDepositDatabaseRepository,
  NotifyCreditDepositJdpiNestObserver,
  PixPaymentServiceKafka,
} from '@zro/api-jdpi/infrastructure';
import { HandleNotifyCreditDepositJdpiEventRequest } from '@zro/api-jdpi/interface';
import { AppModule } from '@zro/api-jdpi/infrastructure/nest/modules/app.module';
import { NotifyCreditDepositFactory } from '@zro/test/api-jdpi/config';

describe('NotifyCreditDepositJdpiNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyCreditDepositJdpiNestObserver;
  let notifyCreditRepository: NotifyCreditDepositRepository;
  let failedNotifyCredit: FailedNotifyCreditRepository;

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

    controller = module.get<NotifyCreditDepositJdpiNestObserver>(
      NotifyCreditDepositJdpiNestObserver,
    );
    notifyCreditRepository = new NotifyCreditDepositDatabaseRepository();
    failedNotifyCredit = new FailedNotifyCreditDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCreditDepositEventViaPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify credit deposit successfully', async () => {
        const data =
          await NotifyCreditDepositFactory.create<NotifyCreditDepositEntity>(
            NotifyCreditDepositEntity.name,
          );

        const message: HandleNotifyCreditDepositJdpiEventRequest = {
          externalId: data.externalId,
          endToEndId: data.endToEndId,
          initiationType: JdpiPaymentType.KEY,
          paymentPriorityType: JdpiPaymentPriorityType.PRIORITY,
          paymentPriorityLevelType:
            JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT,
          finalityType: data.finalityType,
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
          notifyCreditRepository,
          'create',
        );

        await controller.handleNotifyCreditDepositJdpiEventViaPixPayment(
          message,
          logger,
          notifyCreditRepository,
          pixPaymentService,
          failedNotifyCredit,
          ctx,
        );

        expect(spyRepositoryCreate).toHaveBeenCalledTimes(1);
        expect(mockReceivePixDepositService).toHaveBeenCalledTimes(1);
        expect(mockReceivePixDevolutionService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
