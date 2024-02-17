import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { KeyType, PixKeyEntity } from '@zro/pix-keys/domain';
import { UserEntity } from '@zro/users/domain';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import {
  TransactionTypeEntity,
  UserWalletEntity,
  WalletEntity,
} from '@zro/operations/domain';
import {
  TransactionTypeNotFoundException,
  UserWalletNotFoundException,
} from '@zro/operations/application';
import {
  CreateApproveUserWithdrawSettingRequestUseCase as UseCase,
  OperationService,
  UserWithdrawSettingRequestEventEmitter,
  PixKeyService,
  UserWithdrawSettingRequestDocumentWrongException,
  UtilService,
  UserWithdrawSettingAlreadyExistsException,
} from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';
import { UserWalletFactory } from '@zro/test/operations/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CreateUserWithdrawSettingRequestUseCase', () => {
  const mockEmitter = () => {
    const eventEmitter: UserWithdrawSettingRequestEventEmitter =
      createMock<UserWithdrawSettingRequestEventEmitter>();

    const mockApprovedUserWithdrawSettingRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.approved));

    return {
      eventEmitter,
      mockApprovedUserWithdrawSettingRequestEvent,
    };
  };

  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockCreateUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.create));

    return {
      userWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetTransactionTypeByTagService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getTransactionTypeByTag));

    const mockGetUserWalletByUserAndWalletService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getUserWalletByUserAndWallet));

    const utilService: UtilService = createMock<UtilService>();
    const mockGetAllByWalletUserWithdrawSettingService: jest.Mock = On(
      utilService,
    ).get(method((mock) => mock.getAllByWalletUserWithdrawSetting));

    const pixKeyService: PixKeyService = createMock<PixKeyService>();
    const mockCreateDecodedPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.createDecoded),
    );

    return {
      operationService,
      mockGetTransactionTypeByTagService,
      mockGetUserWalletByUserAndWalletService,
      utilService,
      mockGetAllByWalletUserWithdrawSettingService,
      pixKeyService,
      mockCreateDecodedPixKeyService,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
    } = mockRepository();

    const { eventEmitter, mockApprovedUserWithdrawSettingRequestEvent } =
      mockEmitter();

    const {
      operationService,
      mockGetTransactionTypeByTagService,
      mockGetUserWalletByUserAndWalletService,
      utilService,
      mockGetAllByWalletUserWithdrawSettingService,
      pixKeyService,
      mockCreateDecodedPixKeyService,
    } = mockService();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRequestRepository,
      operationService,
      pixKeyService,
      eventEmitter,
      utilService,
    );

    return {
      sut,
      mockGetUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
      mockGetTransactionTypeByTagService,
      mockGetUserWalletByUserAndWalletService,
      mockGetAllByWalletUserWithdrawSettingService,
      mockApprovedUserWithdrawSettingRequestEvent,
      mockCreateDecodedPixKeyService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const test = [
        () => sut.execute(null, null, null, null, null, null, null, null, null),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.BALANCE,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({}),
            new UserEntity({}),
            new TransactionTypeEntity({}),
            new PixKeyEntity({}),
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.MONTHLY,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new TransactionTypeEntity({ tag: faker.datatype.string() }),
            new PixKeyEntity({ type: KeyType.EMAIL, key: 'teste@mail.com' }),
          ),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            WithdrawSettingType.WEEKLY,
            faker.datatype.number({ min: 1, max: 9999999 }),
            null,
            null,
            new WalletEntity({ uuid: faker.datatype.uuid() }),
            new UserEntity({ uuid: faker.datatype.uuid() }),
            new TransactionTypeEntity({ tag: faker.datatype.string() }),
            new PixKeyEntity({ type: KeyType.EMAIL, key: 'teste@mail.com' }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if with same id already exists', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { type: WithdrawSettingType.BALANCE },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        userWithdrawSettingRequest.day,
        userWithdrawSettingRequest.weekDay,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.type).toBe(userWithdrawSettingRequest.type);
      expect(result.balance).toBe(userWithdrawSettingRequest.balance);
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if user wallet not found', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { type: WithdrawSettingType.BALANCE },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          userWithdrawSettingRequest.id,
          userWithdrawSettingRequest.type,
          userWithdrawSettingRequest.balance,
          userWithdrawSettingRequest.day,
          userWithdrawSettingRequest.weekDay,
          userWithdrawSettingRequest.wallet,
          userWithdrawSettingRequest.user,
          userWithdrawSettingRequest.transactionType,
          userWithdrawSettingRequest.pixKey,
        );

      await expect(test).rejects.toThrow(UserWalletNotFoundException);
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if transaction type not found', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { type: WithdrawSettingType.BALANCE },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          userWithdrawSettingRequest.id,
          userWithdrawSettingRequest.type,
          userWithdrawSettingRequest.balance,
          userWithdrawSettingRequest.day,
          userWithdrawSettingRequest.weekDay,
          userWithdrawSettingRequest.wallet,
          userWithdrawSettingRequest.user,
          userWithdrawSettingRequest.transactionType,
          userWithdrawSettingRequest.pixKey,
        );

      await expect(test).rejects.toThrow(TransactionTypeNotFoundException);
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create user withdraw setting failed if document dont match with decoded pix key', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.FAILED,
            type: WithdrawSettingType.MONTHLY,
            day: 10,
          },
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockCreateDecodedPixKeyService.mockResolvedValue(pixKey);

      const test = () =>
        sut.execute(
          userWithdrawSettingRequest.id,
          userWithdrawSettingRequest.type,
          userWithdrawSettingRequest.balance,
          userWithdrawSettingRequest.day,
          null,
          userWithdrawSettingRequest.wallet,
          userWithdrawSettingRequest.user,
          userWithdrawSettingRequest.transactionType,
          userWithdrawSettingRequest.pixKey,
        );

      await expect(test).rejects.toThrow(
        UserWithdrawSettingRequestDocumentWrongException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create balance user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.PENDING,
            type: WithdrawSettingType.BALANCE,
          },
        );

      userWithdrawSettingRequest.pixKey.document = null;

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        null,
        null,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(UserWithdrawSettingRequestState.PENDING);
      expect(result.analysisResult).toBeUndefined();
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(WithdrawSettingType.BALANCE);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.closedAt).toBeUndefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should create daily user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.PENDING,
            type: WithdrawSettingType.DAILY,
          },
        );

      userWithdrawSettingRequest.pixKey.document = null;

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        null,
        null,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(UserWithdrawSettingRequestState.PENDING);
      expect(result.analysisResult).toBeUndefined();
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(WithdrawSettingType.DAILY);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.closedAt).toBeUndefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should create weekly user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.PENDING,
            type: WithdrawSettingType.WEEKLY,
            weekDay: WithdrawSettingWeekDays.MONDAY,
          },
        );

      userWithdrawSettingRequest.pixKey.document = null;

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        null,
        userWithdrawSettingRequest.weekDay,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(UserWithdrawSettingRequestState.PENDING);
      expect(result.analysisResult).toBeUndefined();
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(WithdrawSettingType.WEEKLY);
      expect(result.day).toBeUndefined();
      expect(result.weekDay).toBe(userWithdrawSettingRequest.weekDay);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.closedAt).toBeUndefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should create monthly user withdraw setting request successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.PENDING,
            type: WithdrawSettingType.MONTHLY,
            day: 10,
          },
        );

      userWithdrawSettingRequest.pixKey.document = null;

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        userWithdrawSettingRequest.day,
        null,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(UserWithdrawSettingRequestState.PENDING);
      expect(result.analysisResult).toBeUndefined();
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(WithdrawSettingType.MONTHLY);
      expect(result.day).toBe(userWithdrawSettingRequest.day);
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.closedAt).toBeUndefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should create user withdraw setting request with decoded pix key information successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetUserWalletByUserAndWalletService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          {
            state: UserWithdrawSettingRequestState.PENDING,
            type: WithdrawSettingType.MONTHLY,
            day: 10,
          },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetUserWalletByUserAndWalletService.mockResolvedValue(userWallet);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        userWithdrawSettingRequest.transactionType,
      );
      mockCreateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockCreateDecodedPixKeyService.mockResolvedValue(
        userWithdrawSettingRequest.pixKey,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.type,
        userWithdrawSettingRequest.balance,
        userWithdrawSettingRequest.day,
        null,
        userWithdrawSettingRequest.wallet,
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.transactionType,
        userWithdrawSettingRequest.pixKey,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(UserWithdrawSettingRequestState.PENDING);
      expect(result.analysisResult).toBeUndefined();
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(WithdrawSettingType.MONTHLY);
      expect(result.day).toBe(userWithdrawSettingRequest.day);
      expect(result.weekDay).toBeUndefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.closedAt).toBeUndefined();
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.transactionType.tag,
      );
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWalletService).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.wallet,
      );
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should not create if user already has automatic withdrawal', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
        mockGetTransactionTypeByTagService,
        mockGetAllByWalletUserWithdrawSettingService,
        mockApprovedUserWithdrawSettingRequestEvent,
        mockCreateDecodedPixKeyService,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { type: WithdrawSettingType.BALANCE },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);
      mockGetAllByWalletUserWithdrawSettingService.mockResolvedValue([
        userWithdrawSettingRequest,
      ]);

      const test = () =>
        sut.execute(
          userWithdrawSettingRequest.id,
          userWithdrawSettingRequest.type,
          userWithdrawSettingRequest.balance,
          userWithdrawSettingRequest.day,
          userWithdrawSettingRequest.weekDay,
          userWithdrawSettingRequest.wallet,
          userWithdrawSettingRequest.user,
          userWithdrawSettingRequest.transactionType,
          userWithdrawSettingRequest.pixKey,
        );

      await expect(test).rejects.toThrow(
        UserWithdrawSettingAlreadyExistsException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllByWalletUserWithdrawSettingService,
      ).toHaveBeenCalledTimes(1);
      expect(mockApprovedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateDecodedPixKeyService).toHaveBeenCalledTimes(0);
    });
  });
});
