import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import { UserLimitEntity } from '@zro/operations/domain';
import {
  HandleOpenPendingUserLimitRequestUseCase as UseCase,
  UserLimitRequestEventEmitter,
  UserLimitRequestGateway,
  UserLimitRequestNotFoundException,
  UserService,
} from '@zro/compliance/application';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('HandldeOpenPenginUserLimitRequestUseCase', () => {
  const makeSut = () => {
    const {
      userLimitRequestRepository,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
    } = mockRepository();

    const { eventEmitter, mockOpenConfirmedUserLimitRequestEvent } =
      mockEmitter();

    const { userLimitRequestGateway, mockCreateUserLimitRequestGateway } =
      mockGateway();

    const { userService, mockGetByUuidService } = mockService();

    const sut = new UseCase(
      logger,
      userLimitRequestRepository,
      eventEmitter,
      userLimitRequestGateway,
      userService,
    );

    return {
      sut,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
      mockOpenConfirmedUserLimitRequestEvent,
      mockCreateUserLimitRequestGateway,
      mockGetByUuidService,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: UserLimitRequestEventEmitter =
      createMock<UserLimitRequestEventEmitter>();

    const mockOpenConfirmedUserLimitRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.openConfirmed));

    return {
      eventEmitter,
      mockOpenConfirmedUserLimitRequestEvent,
    };
  };

  const mockRepository = () => {
    const userLimitRequestRepository: UserLimitRequestRepository =
      createMock<UserLimitRequestRepository>();

    const mockGetByIdUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.update));

    return {
      userLimitRequestRepository,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
    };
  };

  const mockGateway = () => {
    const userLimitRequestGateway: UserLimitRequestGateway =
      createMock<UserLimitRequestGateway>();

    const mockCreateUserLimitRequestGateway: jest.Mock = On(
      userLimitRequestGateway,
    ).get(method((mock) => mock.createUserLimitRequest));

    return {
      userLimitRequestGateway,
      mockCreateUserLimitRequestGateway,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();

    const mockGetByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getByUuid),
    );

    return {
      userService,
      mockGetByUuidService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if user limit not has id', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockOpenConfirmedUserLimitRequestEvent,
        mockCreateUserLimitRequestGateway,
        mockGetByUuidService,
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

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateUserLimitRequestGateway).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw UserLimitRequestNotFound if user limit request not exists', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockOpenConfirmedUserLimitRequestEvent,
        mockCreateUserLimitRequestGateway,
        mockGetByUuidService,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
        );

      mockGetByIdUserLimitRequestRepository.mockImplementationOnce(null);

      const test = () => sut.execute(userLimitRequest);

      await expect(test).rejects.toThrow(UserLimitRequestNotFoundException);

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateUserLimitRequestGateway).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should update user limit request with success', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockOpenConfirmedUserLimitRequestEvent,
        mockCreateUserLimitRequestGateway,
        mockGetByUuidService,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
          {
            state: UserLimitRequestState.OPEN_PENDING,
          },
        );

      mockGetByIdUserLimitRequestRepository.mockResolvedValue(userLimitRequest);
      mockGetByUuidService.mockResolvedValue(userLimitRequest.user);

      await sut.execute(userLimitRequest);

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockOpenConfirmedUserLimitRequestEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateUserLimitRequestGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidService).toHaveBeenCalledTimes(1);
    });
  });
});
