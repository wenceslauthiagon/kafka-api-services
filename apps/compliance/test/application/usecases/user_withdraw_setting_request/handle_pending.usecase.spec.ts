import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  HandleUserWithdrawSettingRequestPendingUseCase as UseCase,
  OperationService,
  UserWithdrawSettingRequestEventEmitter,
  UserService,
  UserWithdrawSettingRequestGateway,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('HandleUserWithdrawSettingRequestPendingUseCase', () => {
  const mockEmitter = () => {
    const eventEmitter: UserWithdrawSettingRequestEventEmitter =
      createMock<UserWithdrawSettingRequestEventEmitter>();

    const mockOpenUserWithdrawSettingRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.open));

    return {
      eventEmitter,
      mockOpenUserWithdrawSettingRequestEvent,
    };
  };

  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.update));

    return {
      userWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetTransactionTypeByTagService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getTransactionTypeByTag));
    const mockGetWalletByUuidService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletByUuid),
    );

    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getByUuid),
    );

    return {
      operationService,
      mockGetTransactionTypeByTagService,
      mockGetWalletByUuidService,
      userService,
      mockGetUserByUuidService,
    };
  };

  const mockGateway = () => {
    const userWithdrawSettingRequestGateway: UserWithdrawSettingRequestGateway =
      createMock<UserWithdrawSettingRequestGateway>();

    const mockCreateUserWithdrawSettingRequestGateway: jest.Mock = On(
      userWithdrawSettingRequestGateway,
    ).get(method((mock) => mock.create));

    return {
      userWithdrawSettingRequestGateway,
      mockCreateUserWithdrawSettingRequestGateway,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
    } = mockRepository();

    const { eventEmitter, mockOpenUserWithdrawSettingRequestEvent } =
      mockEmitter();

    const {
      operationService,
      mockGetTransactionTypeByTagService,
      mockGetWalletByUuidService,
      userService,
      mockGetUserByUuidService,
    } = mockService();

    const {
      userWithdrawSettingRequestGateway,
      mockCreateUserWithdrawSettingRequestGateway,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRequestRepository,
      userWithdrawSettingRequestGateway,
      eventEmitter,
      userService,
      operationService,
    );

    return {
      sut,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestGateway,
      mockOpenUserWithdrawSettingRequestEvent,
      mockGetUserByUuidService,
      mockGetTransactionTypeByTagService,
      mockGetWalletByUuidService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestGateway,
        mockOpenUserWithdrawSettingRequestEvent,
        mockGetUserByUuidService,
        mockGetTransactionTypeByTagService,
        mockGetWalletByUuidService,
      } = makeSut();

      const tests = [
        () => sut.execute(null),
        () => sut.execute(new UserWithdrawSettingRequestEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWithdrawSettingRequestGateway).toHaveBeenCalledTimes(
        0,
      );
      expect(mockOpenUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle if user withdraw setting request not found', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestGateway,
        mockOpenUserWithdrawSettingRequestEvent,
        mockGetUserByUuidService,
        mockGetTransactionTypeByTagService,
        mockGetWalletByUuidService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);

      const test = () => sut.execute(userWithdrawSettingRequest);

      await expect(test).rejects.toThrow(
        UserWithdrawSettingRequestNotFoundException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWithdrawSettingRequestGateway).toHaveBeenCalledTimes(
        0,
      );
      expect(mockOpenUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle if state not is pending', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestGateway,
        mockOpenUserWithdrawSettingRequestEvent,
        mockGetUserByUuidService,
        mockGetTransactionTypeByTagService,
        mockGetWalletByUuidService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { state: UserWithdrawSettingRequestState.OPEN },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      await sut.execute(userWithdrawSettingRequest);

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWithdrawSettingRequestGateway).toHaveBeenCalledTimes(
        0,
      );
      expect(mockOpenUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestGateway,
        mockOpenUserWithdrawSettingRequestEvent,
        mockGetUserByUuidService,
        mockGetTransactionTypeByTagService,
        mockGetWalletByUuidService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { state: UserWithdrawSettingRequestState.PENDING },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockGetUserByUuidService.mockResolvedValue(
        userWithdrawSettingRequest.user,
      );
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockGetWalletByUuidService.mockResolvedValue(
        userWithdrawSettingRequest.wallet,
      );
      mockUpdateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockCreateUserWithdrawSettingRequestGateway.mockResolvedValue({
        issueId: faker.datatype.uuid(),
        key: faker.datatype.string(),
      });

      await sut.execute(userWithdrawSettingRequest);

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateUserWithdrawSettingRequestGateway).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateUserWithdrawSettingRequestGateway).toHaveBeenCalledWith(
        userWithdrawSettingRequest,
      );
      expect(mockOpenUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(1);
      expect(mockOpenUserWithdrawSettingRequestEvent).toHaveBeenCalledWith(
        userWithdrawSettingRequest,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user.uuid,
      );
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );

      expect(mockGetWalletByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.wallet.uuid,
      );
    });
  });
});
