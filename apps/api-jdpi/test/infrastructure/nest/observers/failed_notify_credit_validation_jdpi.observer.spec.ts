import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyCreditValidationRepository,
  NotifyCreditValidationResponse,
  NotifyCreditValidationState,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationDatabaseRepository,
  FailedNotifyCreditValidationNestObserver,
  NotifyCreditValidationModel,
} from '@zro/api-jdpi/infrastructure';
import { HandleFailedNotifyCreditValidationEventRequest } from '@zro/api-jdpi/interface';
import { AppModule } from '@zro/api-jdpi/infrastructure/nest/modules/app.module';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';

describe('FailedNotifyCreditValidationNestObserver', () => {
  let module: TestingModule;
  let controller: FailedNotifyCreditValidationNestObserver;
  let notifyCreditValidationRepository: NotifyCreditValidationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<FailedNotifyCreditValidationNestObserver>(
      FailedNotifyCreditValidationNestObserver,
    );
    notifyCreditValidationRepository =
      new NotifyCreditValidationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleFailedNotifyCreditValidationEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create failed notify credit validation successfully.', async () => {
        const data =
          await NotifyCreditValidationFactory.create<NotifyCreditValidationModel>(
            NotifyCreditValidationModel.name,
            {
              state: NotifyCreditValidationState.FAILED,
            },
          );

        const notifyCreditValidationResponse: NotifyCreditValidationResponse = {
          resultType: data.responseResultType,
          createdAt: data.responseCreatedAt,
        };

        const message: HandleFailedNotifyCreditValidationEventRequest = {
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
        expect(found.state).toBe(NotifyCreditValidationState.FAILED);
        expect(spyRepositoryCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
