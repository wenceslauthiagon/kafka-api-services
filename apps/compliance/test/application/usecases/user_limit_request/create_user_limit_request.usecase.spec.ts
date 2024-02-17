import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { UserLimitEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CreateUserLimitRequestUseCase as UseCase,
  UserLimitNotFoundException,
  UserLimitRequestEventEmitter,
  UserLimitRequestService,
} from '@zro/compliance/application';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('CreateUserLimitRequestUseCase', () => {
  const makeSut = () => {
    const {
      userLimitRequestRepository,
      mockCreateUserLimitRequestRepository,
      mockGetUserLimitRequestRepository,
    } = mockRepository();

    const { eventEmitter, mockCreatedUserLimitRequestEvent } = mockEmitter();

    const { userLimitRequestService, mockGetUserLimitService } = mockService();

    const sut = new UseCase(
      logger,
      userLimitRequestRepository,
      eventEmitter,
      userLimitRequestService,
    );

    return {
      sut,
      mockCreateUserLimitRequestRepository,
      mockCreatedUserLimitRequestEvent,
      mockGetUserLimitService,
      mockGetUserLimitRequestRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: UserLimitRequestEventEmitter =
      createMock<UserLimitRequestEventEmitter>();

    const mockCreatedUserLimitRequestEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.openPending),
    );

    return {
      eventEmitter,
      mockCreatedUserLimitRequestEvent,
    };
  };

  const mockRepository = () => {
    const userLimitRequestRepository: UserLimitRequestRepository =
      createMock<UserLimitRequestRepository>();

    const mockGetUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockCreateUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.create));

    return {
      userLimitRequestRepository,
      mockCreateUserLimitRequestRepository,
      mockGetUserLimitRequestRepository,
    };
  };

  const mockService = () => {
    const userLimitRequestService: UserLimitRequestService =
      createMock<UserLimitRequestService>();

    const mockGetUserLimitService: jest.Mock = On(userLimitRequestService).get(
      method((mock) => mock.getUserLimit),
    );

    return {
      userLimitRequestService,
      mockGetUserLimitService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create user limit request if missing params', async () => {
      const {
        sut,
        mockCreateUserLimitRequestRepository,
        mockCreatedUserLimitRequestEvent,
        mockGetUserLimitService,
        mockGetUserLimitRequestRepository,
      } = makeSut();

      const test = [
        () =>
          sut.execute(
            new UserLimitRequestEntity({ user: null, userLimit: null }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: new UserEntity({}),
              userLimit: null,
            }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: null,
              userLimit: new UserLimitEntity({}),
            }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: new UserEntity({}),
              userLimit: new UserLimitEntity({}),
            }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCreateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitService).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitRequestRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw UserLimitNotFound if user limit not exists', async () => {
      const {
        sut,
        mockCreateUserLimitRequestRepository,
        mockCreatedUserLimitRequestEvent,
        mockGetUserLimitService,
        mockGetUserLimitRequestRepository,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
        );

      mockGetUserLimitService.mockImplementationOnce(null);
      mockGetUserLimitRequestRepository.mockImplementationOnce(null);

      const test = () => sut.execute(userLimitRequest);

      await expect(test).rejects.toThrow(UserLimitNotFoundException);

      expect(mockGetUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserLimitService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create user limit request', async () => {
      const {
        sut,
        mockCreateUserLimitRequestRepository,
        mockCreatedUserLimitRequestEvent,
        mockGetUserLimitService,
        mockGetUserLimitRequestRepository,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
          {
            requestYearlyLimit: 100000000,
            requestMonthlyLimit: 100000,
            requestDailyLimit: 1000,
            requestNightlyLimit: 1000,
            requestMaxAmount: 1000,
            requestMinAmount: 1000,
            requestMaxAmountNightly: 1000,
            requestMinAmountNightly: 1000,
          },
        );

      mockCreateUserLimitRequestRepository.mockResolvedValue(userLimitRequest);
      mockGetUserLimitRequestRepository.mockImplementationOnce(null);

      const createdUserLimitRequest = await sut.execute(userLimitRequest);

      expect(createdUserLimitRequest).toBeDefined();
      expect(createdUserLimitRequest.id).toBeDefined();
      expect(createdUserLimitRequest.status).toBe(UserLimitRequestStatus.OPEN);
      expect(createdUserLimitRequest.state).toBe(
        UserLimitRequestState.OPEN_PENDING,
      );
      expect(createdUserLimitRequest.user).toBeDefined();
      expect(createdUserLimitRequest.userLimit).toBeDefined();
      expect(createdUserLimitRequest.limitTypeDescription).toBe(
        userLimitRequest.limitTypeDescription,
      );
      expect(createdUserLimitRequest.requestYearlyLimit).toBeDefined();
      expect(createdUserLimitRequest.requestMonthlyLimit).toBeDefined();
      expect(createdUserLimitRequest.requestDailyLimit).toBeDefined();
      expect(createdUserLimitRequest.requestNightlyLimit).toBeDefined();
      expect(createdUserLimitRequest.requestMaxAmount).toBeDefined();
      expect(createdUserLimitRequest.requestMaxAmount).toBeDefined();
      expect(createdUserLimitRequest.requestMinAmount).toBeDefined();
      expect(createdUserLimitRequest.requestMaxAmountNightly).toBeDefined();
      expect(createdUserLimitRequest.requestMinAmountNightly).toBeDefined();
      expect(createdUserLimitRequest.createdAt).toBeDefined();
      expect(createdUserLimitRequest.updatedAt).toBeDefined();
      expect(mockGetUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateUserLimitRequestRepository).toHaveBeenCalledWith(
        userLimitRequest,
      );
      expect(mockCreatedUserLimitRequestEvent).toHaveBeenCalledTimes(1);
      expect(mockCreatedUserLimitRequestEvent).toHaveBeenCalledWith(
        userLimitRequest,
      );
      expect(mockGetUserLimitService).toHaveBeenCalledTimes(1);
    });
  });
});
