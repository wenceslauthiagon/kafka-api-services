import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  ForbiddenException,
  PaginationEntity,
  defaultLogger as logger,
  paginationToDomain,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  OperationEntity,
  OperationRepository,
  OperationState,
  UserWalletRepository,
  WalletAccountEntity,
  WalletAccountCacheRepository,
  WalletAccountTransactionEntity,
  WalletAccountTransactionRepository,
  WalletEntity,
} from '@zro/operations/domain';
import { GetStatementUseCase as UseCase } from '@zro/operations/application';
import {
  OperationFactory,
  WalletAccountFactory,
  WalletAccountTransactionFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetStatementUseCase', () => {
  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetByUserAndWallet: jest.Mock = On(userWalletRepository).get(
      method((mock) => mock.getByUserAndWallet),
    );

    const walletAccountCacheRepository: WalletAccountCacheRepository =
      createMock<WalletAccountCacheRepository>();
    const mockGetAllByWallet: jest.Mock = On(walletAccountCacheRepository).get(
      method((mock) => mock.getAllByWallet),
    );

    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetAllByWalletAccountsAndFilter: jest.Mock = On(
      operationRepository,
    ).get(method((mock) => mock.getAllByWalletAccountsAndFilter));

    const walletAccountTransactionRepository: WalletAccountTransactionRepository =
      createMock<WalletAccountTransactionRepository>();
    const mockGetByOperation: jest.Mock = On(
      walletAccountTransactionRepository,
    ).get(method((mock) => mock.getByOperation));

    return {
      userWalletRepository,
      walletAccountCacheRepository,
      operationRepository,
      walletAccountTransactionRepository,
      mockGetByUserAndWallet,
      mockGetAllByWallet,
      mockGetAllByWalletAccountsAndFilter,
      mockGetByOperation,
    };
  };

  const makeSut = () => {
    const {
      userWalletRepository,
      walletAccountCacheRepository,
      operationRepository,
      walletAccountTransactionRepository,
      mockGetByUserAndWallet,
      mockGetAllByWallet,
      mockGetAllByWalletAccountsAndFilter,
      mockGetByOperation,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      walletAccountTransactionRepository,
      userWalletRepository,
    );
    return {
      sut,
      mockGetByUserAndWallet,
      mockGetAllByWallet,
      mockGetAllByWalletAccountsAndFilter,
      mockGetByOperation,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get with missing params', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
        mockGetByOperation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const tests = [
        () => sut.execute(null, null, null, null),
        () => sut.execute(user, null, null, null),
        () => sut.execute(null, wallet, null, null),
        () => sut.execute(null, null, new PaginationEntity(), null),
        () => sut.execute(null, null, null, {}),
        () => sut.execute(user, wallet, new PaginationEntity(), null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(0);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(0);
      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if wallet not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
        mockGetByOperation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByUserAndWallet.mockResolvedValue(null);

      const pagination = new PaginationEntity();
      const filter = {};

      await expect(() =>
        sut.execute(user, wallet, pagination, filter),
      ).rejects.toThrow(ForbiddenException);

      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(0);
      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get if walletAccounts not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
        mockGetByOperation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const pagination = new PaginationEntity();
      const filter = {};

      const result = await sut.execute(user, wallet, pagination, filter);

      mockGetByUserAndWallet.mockResolvedValue({ user, wallet });
      mockGetAllByWallet.mockResolvedValue(wallet);

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
        expect(res.operation.id).toBeDefined();
      });
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(0);
      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should get operations successfully', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
        mockGetByOperation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const operations = await OperationFactory.createMany<OperationEntity>(
        OperationEntity.name,

        3,
        { state: OperationState.ACCEPTED },
      );
      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      const pagination = new PaginationEntity();
      const filter = {};

      mockGetByUserAndWallet.mockResolvedValue({ user, wallet });
      mockGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetAllByWalletAccountsAndFilter.mockResolvedValue(
        paginationToDomain(pagination, operations.length, operations),
      );

      for (const operation of operations) {
        const walletAccountTransaction =
          WalletAccountTransactionFactory.create<WalletAccountTransactionEntity>(
            WalletAccountTransactionEntity.name,
            { operation },
          );

        mockGetByOperation.mockResolvedValue(walletAccountTransaction);
      }

      const result = await sut.execute(user, wallet, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
      });
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledWith(
        walletAccounts,
        pagination,
        filter,
      );
      expect(mockGetByOperation).toHaveBeenCalledTimes(3);
    });
  });
});
