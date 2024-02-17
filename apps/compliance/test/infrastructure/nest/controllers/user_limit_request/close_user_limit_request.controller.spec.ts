import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
} from '@zro/compliance/domain';
import { CloseUserLimitRequestMicroserviceController as Controller } from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  CloseUserLimitRequest,
  UserLimitRequestEventEmitterControllerInterface,
  UserLimitRequestEventType,
} from '@zro/compliance/interface';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('CloseUserLimitRequestMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const userLimitRequestRepository: UserLimitRequestRepository =
    createMock<UserLimitRequestRepository>();

  const mockGetUserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.getById));

  const mockUpdateserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.update));

  const eventEmitterController: UserLimitRequestEventEmitterControllerInterface =
    createMock<UserLimitRequestEventEmitterControllerInterface>();

  const mockUserLimitRequestEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserLimitRequestEvent));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CloseUserLimitRequest', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should cancel user limit request successfully', async () => {
        const userLimit =
          await UserLimitRequestFactory.create<UserLimitRequestEntity>(
            UserLimitRequestEntity.name,
            { state: UserLimitRequestState.OPEN_CONFIRMED },
          );

        const message: CloseUserLimitRequest = {
          id: userLimit.id,
          analysisResult: UserLimitRequestAnalysisResultType.APPROVED,
        };

        mockGetUserLimitRequestRepository.mockResolvedValueOnce(userLimit);

        await controller.execute(
          userLimitRequestRepository,
          eventEmitterController,
          logger,
          message,
        );

        expect(mockGetUserLimitRequestRepository).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController).toHaveBeenCalledTimes(1);
        expect(mockUpdateserLimitRequestRepository).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController.mock.calls[0][0]).toBe(
          UserLimitRequestEventType.CLOSED_CONFIRMED_APPROVED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not cancel if missing userLimitId', async () => {
        const message: CloseUserLimitRequest = {
          id: null,
          analysisResult: null,
        };

        const test = () =>
          controller.execute(
            userLimitRequestRepository,
            eventEmitterController,
            logger,
            message,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
