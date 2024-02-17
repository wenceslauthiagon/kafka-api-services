import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  OperationEntity,
  OperationRepository,
  UserWalletRepository,
  WalletAccountEntity,
  WalletAccountCacheRepository,
  WalletEntity,
} from '@zro/operations/domain';
import {
  GetOperationByUserAndWalletAndIdUseCase as UseCase,
  OperationNotFoundException,
  WalletAccountsNotFoundException,
} from '@zro/operations/application';
import {
  OperationFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetOperationByUserAndWalletAndIdUseCase', () => {
  const mockRepository = () => {
    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetByWalletAccountsAndId: jest.Mock = On(operationRepository).get(
      method((mock) => mock.getByWalletAccountsAndId),
    );

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
      mockGetByWalletAccountsAndId,
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
      mockGetByWalletAccountsAndId,
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
      mockGetByWalletAccountsAndId,
      mockGetByUserAndWallet,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get with missing params', async () => {
      const { sut, mockGetByWalletAccountsAndId, mockGetAllByWallet } =
        makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(new UserEntity({}), null, null),
        () => sut.execute(null, new WalletEntity({}), null),
        () => sut.execute(null, null, faker.datatype.uuid()),
        () =>
          sut.execute(
            new UserEntity({}),
            new WalletEntity({}),
            faker.datatype.uuid(),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if login wallet not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetByWalletAccountsAndId,
        mockGetAllByWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const id = faker.datatype.uuid();

      mockGetByUserAndWallet.mockResolvedValue(null);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(OperationNotFoundException);
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get if wallet accounts not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetByWalletAccountsAndId,
        mockGetAllByWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const id = faker.datatype.uuid();

      mockGetByUserAndWallet.mockResolvedValue({ user, wallet });
      mockGetAllByWallet.mockResolvedValue([]);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(WalletAccountsNotFoundException);
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not get if operation not found', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetByWalletAccountsAndId,
        mockGetAllByWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      const id = faker.datatype.uuid();

      mockGetByUserAndWallet.mockResolvedValue({ user, wallet });
      mockGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(null);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(OperationNotFoundException);

      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should get operation successfully', async () => {
      const {
        sut,
        mockGetByUserAndWallet,
        mockGetByWalletAccountsAndId,
        mockGetAllByWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockGetByUserAndWallet.mockResolvedValue({ user, wallet });
      mockGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(mockGetByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
    });
  });
});
