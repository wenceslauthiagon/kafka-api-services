import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyCreditValidationRepository,
  NotifyCreditValidationResponse,
  NotifyCreditValidationState,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationDatabaseRepository,
  ReadyNotifyCreditValidationNestObserver,
  NotifyCreditValidationModel,
} from '@zro/api-jdpi/infrastructure';
import { HandleReadyNotifyCreditValidationEventRequest } from '@zro/api-jdpi/interface';
import { AppModule } from '@zro/api-jdpi/infrastructure/nest/modules/app.module';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';

describe('ReadyNotifyCreditValidationNestObserver', () => {
  let module: TestingModule;
  let controller: ReadyNotifyCreditValidationNestObserver;
  let notifyCreditValidationRepository: NotifyCreditValidationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<ReadyNotifyCreditValidationNestObserver>(
      ReadyNotifyCreditValidationNestObserver,
    );
    notifyCreditValidationRepository =
      new NotifyCreditValidationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleReadyNotifyCreditValidationEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create ready notify credit validation successfully.', async () => {
        const data =
          await NotifyCreditValidationFactory.create<NotifyCreditValidationModel>(
            NotifyCreditValidationModel.name,
          );

        const notifyCreditValidationResponse: NotifyCreditValidationResponse = {
          resultType: data.responseResultType,
          createdAt: data.responseCreatedAt,
        };

        const message: HandleReadyNotifyCreditValidationEventRequest = {
          id: data.id,
          initiationType: data.initiationType,
          paymentPriorityType: data.paymentPriorityType,
          paymentPriorityLevelType: data.paymentPriorityLevelType,
          finalityType: data.finalityType,
          thirdPartIspb: data.thirdPartIspb,
          thirdPartPersonType: data.thirdPartPersonType,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartName: data.thirdPartName,
          thirdPartAccountType: data.thirdPartAccountType,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          clientIspb: data.clientIspb,
          clientPersonType: data.clientPersonType,
          clientDocument: data.clientDocument,
          clientAccountType: data.clientAccountType,
          clientAccountNumber: data.clientAccountNumber,
          amount: data.amount,
          response: notifyCreditValidationResponse,
        };

        jest
          .spyOn(notifyCreditValidationRepository, 'getById')
          .mockResolvedValue(null);
        const spyRepositoryCreate = jest.spyOn(
          notifyCreditValidationRepository,
          'create',
        );

        await controller.execute(
          message,
          notifyCreditValidationRepository,
          logger,
        );

        const found = await NotifyCreditValidationModel.findOne({
          where: { id: data.id },
        });

        expect(found).toBeDefined();
        expect(found.state).toBe(NotifyCreditValidationState.READY);
        expect(spyRepositoryCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
