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
  UserWalletRepository,
  WalletAccountEntity,
  WalletAccountCacheRepository,
  WalletEntity,
} from '@zro/operations/domain';
import { GetAllOperationsByUserAndWalletAndFilterUseCase as UseCase } from '@zro/operations/application';
import {
  OperationFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllOperationsByUserAndWalletAndFilterUseCase', () => {
  const mockRepository = () => {
    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetAllByWalletAccountsAndFilter: jest.Mock = On(
      operationRepository,
    ).get(method((mock) => mock.getAllByWalletAccountsAndFilter));

    const walletAccountCacheRepository: WalletAccountCacheRepository =
      createMock<WalletAccountCacheRepository>();
    const mockGetAllByWallet: jest.Mock = On(walletAccountCacheRepository).get(
      method((mock) => mock.getAllByWallet),
    );

    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetByUserAndWallet: jest.Mock = On(userWalletRepository).get(
      method((mock) => mock.getByUserAndWallet),
    );

    return {
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      mockGetAllByWalletAccountsAndFilter,
      mockGetAllByWallet,
      mockGetByUserAndWallet,
    };
  };

  const makeSut = () => {
    const {
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      mockGetAllByWallet,
      mockGetAllByWalletAccountsAndFilter,
      mockGetByUserAndWallet,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
    );
    return {
      sut,
      operationRepository,
      mockGetAllByWallet,
      mockGetAllByWalletAccountsAndFilter,
      mockGetByUserAndWallet,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get with missing params', async () => {
      const { sut, mockGetAllByWalletAccountsAndFilter, mockGetAllByWallet } =
        makeSut();

      const tests = [
        () => sut.execute(null, null, null, null),
        () => sut.execute(new UserEntity({}), null, null, null),
        () => sut.execute(null, new WalletEntity({}), null, null),
        () => sut.execute(null, null, new PaginationEntity(), null),
        () => sut.execute(null, null, null, {}),
        () =>
          sut.execute(
            new UserEntity({}),
            new WalletEntity({}),
            new PaginationEntity(),
            {},
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if wallet not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
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
    });

    it('TC0003 - Should not get if wallet not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
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
        expect(res.id).toBeDefined();
      });
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWalletAccountsAndFilter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should get operations successfully', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetAllByWalletAccountsAndFilter,
        mockGetAllByWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const operations = await OperationFactory.createMany<OperationEntity>(
        OperationEntity.name,
        3,
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
        expect(res.id).toBeDefined();
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
    });
  });
});
