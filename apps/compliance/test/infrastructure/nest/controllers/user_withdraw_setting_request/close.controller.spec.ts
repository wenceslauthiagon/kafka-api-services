import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import { UtilService } from '@zro/compliance/application';
import {
  CloseUserWithdrawSettingRequestMicroserviceController as Controller,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestModel,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  CloseUserWithdrawSettingRequest,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
  UserWithdrawSettingRequestEventType,
} from '@zro/compliance/interface';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('CloseUserWithdrawSettingRequestMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository;

  const eventEmitterController: UserWithdrawSettingRequestEventEmitterControllerInterface =
    createMock<UserWithdrawSettingRequestEventEmitterControllerInterface>();
  const mockEmitUserWithdrawSettingRequestEvent: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserWithdrawSettingRequestEvent));

  const utilService: UtilService = createMock<UtilService>();
  const mockCreateUserWithdrawSettingService: jest.Mock = On(utilService).get(
    method((mock) => mock.createUserWithdrawSetting),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWithdrawSettingRequestRepository =
      new UserWithdrawSettingRequestDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CloseUserWithdrawSettingRequest', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not close if missing params', async () => {
        const message: CloseUserWithdrawSettingRequest = {
          id: null,
          analysisResult: null,
        };

        const test = () =>
          controller.execute(
            userWithdrawSettingRequestRepository,
            eventEmitterController,
            utilService,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          0,
        );
        expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should close and approve successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            { state: UserWithdrawSettingRequestState.OPEN },
          );

        const message: CloseUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          analysisResult: UserWithdrawSettingRequestAnalysisResultType.APPROVED,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.analysisResult).toBe(
          UserWithdrawSettingRequestAnalysisResultType.APPROVED,
        );
        expect(result.value.closedAt).toBeDefined();
        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitUserWithdrawSettingRequestEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingRequestEventType.APPROVED,
        );
        expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should close and reject successfully', async () => {
        const userWithdrawSettingRequest =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            { state: UserWithdrawSettingRequestState.OPEN },
          );

        const message: CloseUserWithdrawSettingRequest = {
          id: userWithdrawSettingRequest.id,
          analysisResult: UserWithdrawSettingRequestAnalysisResultType.REJECTED,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          eventEmitterController,
          utilService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSettingRequest.id);
        expect(result.value.analysisResult).toBe(
          UserWithdrawSettingRequestAnalysisResultType.REJECTED,
        );
        expect(result.value.closedAt).toBeDefined();
        expect(mockEmitUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitUserWithdrawSettingRequestEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingRequestEventType.REJECTED,
        );
        expect(mockCreateUserWithdrawSettingService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
