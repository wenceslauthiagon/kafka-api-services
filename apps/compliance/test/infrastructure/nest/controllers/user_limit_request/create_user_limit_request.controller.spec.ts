import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CreateUserLimitRequestMicroserviceController as Controller,
  UserLimitRequestServiceKafka,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  CreateUserLimitRequest,
  UserLimitRequestEventEmitterControllerInterface,
  UserLimitRequestEventType,
} from '@zro/compliance/interface';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateUserLimitRequestMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const userLimitRequestRepository: UserLimitRequestRepository =
    createMock<UserLimitRequestRepository>();

  const mockGetUserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.getById));

  const mockCreateUserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.create));

  const eventEmitterController: UserLimitRequestEventEmitterControllerInterface =
    createMock<UserLimitRequestEventEmitterControllerInterface>();

  const mockUserLimitRequestEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserLimitRequestEvent));

  const userLimitRequestService: UserLimitRequestServiceKafka =
    createMock<UserLimitRequestServiceKafka>();

  const mockGetUserLimitService: jest.Mock = On(userLimitRequestService).get(
    method((mock) => mock.getUserLimit),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateUserLimitRequest', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create user limit request successfully', async () => {
        const requestObject = {
          requestYearlyLimit: 1000,
          requestMonthlyLimit: 1000,
          requestDailyLimit: 1000,
          requestNightlyLimit: 1000,
          requestMaxAmount: 1000,
          requestMinAmount: 1000,
          requestMaxAmountNightly: 1000,
          requestMinAmountNightly: 1000,
        };

        const limitTypeDescription = faker.datatype.string(15);

        const { id, user, userLimit, createdAt, updatedAt } =
          await UserLimitRequestFactory.create<UserLimitRequestEntity>(
            UserLimitRequestEntity.name,
          );

        const message: CreateUserLimitRequest = {
          userId: user.uuid,
          userLimitId: userLimit.id,
          ...requestObject,
        };

        mockGetUserLimitRequestRepository.mockResolvedValueOnce(null);

        mockGetUserLimitService.mockResolvedValueOnce({
          limitTypeDescription,
        });

        mockCreateUserLimitRequestRepository.mockResolvedValueOnce({
          ...requestObject,
          id,
          status: UserLimitRequestStatus.OPEN,
          state: UserLimitRequestState.OPEN_PENDING,
          user: new UserEntity({ uuid: user.uuid }),
          userLimit: new UserLimitRequestEntity({ id: userLimit.id }),
          limitTypeDescription,
          createdAt,
          updatedAt,
        });

        const result = await controller.execute(
          userLimitRequestRepository,
          eventEmitterController,
          userLimitRequestService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.status).toBe(UserLimitRequestStatus.OPEN);
        expect(result.value.state).toBe(UserLimitRequestState.OPEN_PENDING);
        expect(result.value.userId).toBeDefined();
        expect(result.value.userLimitId).toBe(userLimit.id);
        expect(result.value.limitTypeDescription).toBe(limitTypeDescription);
        expect(result.value.requestYearlyLimit).toBe(1000);
        expect(result.value.requestMonthlyLimit).toBe(1000);
        expect(result.value.requestDailyLimit).toBe(1000);
        expect(result.value.requestNightlyLimit).toBe(1000);
        expect(result.value.requestMaxAmount).toBe(1000);
        expect(result.value.requestMinAmount).toBe(1000);
        expect(result.value.requestMaxAmountNightly).toBe(1000);
        expect(result.value.requestMinAmountNightly).toBe(1000);
        expect(result.value.requestMaxAmountNightly).toBe(1000);
        expect(result.value.requestMinAmountNightly).toBe(1000);
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.updatedAt).toBeDefined();
        expect(mockCreateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController.mock.calls[0][0]).toBe(
          UserLimitRequestEventType.OPEN_PENDING,
        );
        expect(mockGetUserLimitService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create if missing userId or userLimitId', async () => {
        const message: CreateUserLimitRequest = {
          userId: null,
          userLimitId: null,
        };

        const test = () =>
          controller.execute(
            userLimitRequestRepository,
            eventEmitterController,
            userLimitRequestService,
            logger,
            message,
            ctx,
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
