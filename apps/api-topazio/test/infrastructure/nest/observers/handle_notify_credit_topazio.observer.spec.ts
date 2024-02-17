import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import {
  KafkaService,
  defaultLogger as logger,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditEntity,
  NotifyCreditRepository,
  StatusType,
} from '@zro/api-topazio/domain';
import {
  NotifyCreditTopazioNestObserver as Observer,
  PixPaymentServiceKafka,
  NotifyCreditDatabaseRepository,
  FailedNotifyCreditDatabaseRepository,
} from '@zro/api-topazio/infrastructure';
import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';
import { HandleNotifyCreditTopazioEventRequest } from '@zro/api-topazio/interface';
import { NotifyCreditFactory } from '@zro/test/api-topazio/config';

describe('NotifyCreditTopazioNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let notifyCreditRepository: NotifyCreditRepository;
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
  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = new Observer(kafkaService, translateService);
    notifyCreditRepository = new NotifyCreditDatabaseRepository();
    failedNotifyCredit = new FailedNotifyCreditDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCreditTopazioEventViaPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle notify credit with deposit successfully', async () => {
        const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
          NotifyCreditEntity.name,
          { status: StatusType.SUCCESS, isDevolution: false },
        );

        const message: HandleNotifyCreditTopazioEventRequest = {
          transactionId: data.transactionId,
          transactionType: data.transactionType,
          isDevolution: data.isDevolution,
          status: data.status,
        };

        const spyRepositoryCreate = jest.spyOn(
          notifyCreditRepository,
          'create',
        );

        await controller.handleNotifyCreditTopazioEventViaPixPayment(
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

      it('TC0002 - Should handle notify credit with devolution received successfully', async () => {
        const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
          NotifyCreditEntity.name,
          { status: StatusType.SUCCESS, isDevolution: true },
        );

        const message: HandleNotifyCreditTopazioEventRequest = {
          transactionId: data.transactionId,
          transactionType: data.transactionType,
          isDevolution: data.isDevolution,
          status: data.status,
        };

        const spyRepositoryCreate = jest.spyOn(
          notifyCreditRepository,
          'create',
        );

        await controller.handleNotifyCreditTopazioEventViaPixPayment(
          message,
          logger,
          notifyCreditRepository,
          pixPaymentService,
          failedNotifyCredit,
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
