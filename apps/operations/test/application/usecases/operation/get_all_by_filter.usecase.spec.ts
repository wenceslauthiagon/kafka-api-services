import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
  paginationToDomain,
} from '@zro/common';
import {
  OperationEntity,
  OperationRepository,
  WalletAccountEntity,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  GetAllOperationsByFilterUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import {
  OperationFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';

describe('GetAllOperationsByFilterUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetAllByFilter: jest.Mock = On(operationRepository).get(
      method((mock) => mock.getAllByFilter),
    );

    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockGetWalletAccountById: jest.Mock = On(walletAccountRepository).get(
      method((mock) => mock.getById),
    );

    return {
      operationRepository,
      mockGetAllByFilter,
      walletAccountRepository,
      mockGetWalletAccountById,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserById: jest.Mock = On(userService).get(
      method((mock) => mock.getUserById),
    );

    return {
      userService,
      mockGetUserById,
    };
  };

  const makeSut = () => {
    const {
      operationRepository,
      mockGetAllByFilter,
      walletAccountRepository,
      mockGetWalletAccountById,
    } = mockRepository();

    const { userService, mockGetUserById } = mockService();

    const sut = new UseCase(
      logger,
      operationRepository,
      walletAccountRepository,
      userService,
    );

    return {
      sut,
      mockGetAllByFilter,
      mockGetUserById,
      mockGetWalletAccountById,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get an operation successfully.', async () => {
      const {
        sut,
        mockGetAllByFilter,
        mockGetUserById,
        mockGetWalletAccountById,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const operations = await OperationFactory.createMany<OperationEntity>(
        OperationEntity.name,
        3,
        {
          owner: new UserEntity({
            id: user.id,
          }),
          ownerWalletAccount: walletAccount,
          beneficiary: null,
          beneficiaryWalletAccount: null,
        },
      );

      const pagination = new PaginationEntity();
      const filter = {};

      mockGetAllByFilter.mockResolvedValue(
        paginationToDomain(pagination, operations.length, operations),
      );

      mockGetUserById.mockResolvedValue(user);
      mockGetWalletAccountById.mockResolvedValue(walletAccount);

      const result = await sut.execute(pagination, filter);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
      });
      expect(mockGetAllByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserById).toHaveBeenCalledTimes(3);
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(3);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw missing data exception if missing params.', async () => {
      const {
        sut,
        mockGetAllByFilter,
        mockGetUserById,
        mockGetWalletAccountById,
      } = makeSut();

      const pagination = new PaginationEntity();
      const filter = {};

      const testScripts = [
        () => sut.execute(pagination, null),
        () => sut.execute(null, filter),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetAllByFilter).toHaveBeenCalledTimes(0);
        expect(mockGetUserById).toHaveBeenCalledTimes(0);
        expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      }
    });
  });
});
