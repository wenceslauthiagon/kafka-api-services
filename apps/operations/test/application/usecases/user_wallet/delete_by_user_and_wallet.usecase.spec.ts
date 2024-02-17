import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserWalletRepository,
  WalletRepository,
  WalletEntity,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  DeleteUserWalletByUserAndWalletUseCase as UseCase,
  WalletCannotBeDeletedException,
} from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('DeleteUserWalletByUserAndWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      userWalletRepository,
      mockGetByUserAndWalletRepository,
      mockDeleteByUserAndWalletRepository,
      walletRepository,
      mockGetByUuidWalletRepository,
    } = mockRepository();

    const sut = new UseCase(logger, userWalletRepository, walletRepository);
    return {
      sut,
      mockGetByUserAndWalletRepository,
      mockDeleteByUserAndWalletRepository,
      mockGetByUuidWalletRepository,
    };
  };

  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetByUserAndWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getByUserAndWallet));
    const mockDeleteByUserAndWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.deleteByUserAndWallet));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetByUuidWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      userWalletRepository,
      mockGetByUserAndWalletRepository,
      mockDeleteByUserAndWalletRepository,
      walletRepository,
      mockGetByUuidWalletRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should delete user wallet successfully ', async () => {
      const {
        sut,
        mockGetByUserAndWalletRepository,
        mockDeleteByUserAndWalletRepository,
        mockGetByUuidWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByUuidWalletRepository.mockResolvedValue(wallet);

      await sut.execute(user, wallet);

      expect(mockGetByUserAndWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteByUserAndWalletRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not delete user wallet if missing data', async () => {
      const {
        sut,
        mockGetByUserAndWalletRepository,
        mockDeleteByUserAndWalletRepository,
        mockGetByUuidWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(user, null),
        () => sut.execute(null, wallet),
        () => sut.execute(user, new WalletEntity({})),
        () => sut.execute(new UserEntity({}), wallet),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUserAndWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteByUserAndWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete user wallet if user wallet not found', async () => {
      const {
        sut,
        mockGetByUserAndWalletRepository,
        mockDeleteByUserAndWalletRepository,
        mockGetByUuidWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByUserAndWalletRepository.mockResolvedValueOnce(undefined);

      await sut.execute(user, wallet);

      expect(mockGetByUserAndWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteByUserAndWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete user wallet if user is wallet owner', async () => {
      const {
        sut,
        mockGetByUserAndWalletRepository,
        mockDeleteByUserAndWalletRepository,
        mockGetByUuidWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { user },
      );

      mockGetByUuidWalletRepository.mockResolvedValueOnce(wallet);

      await expect(() => sut.execute(user, wallet)).rejects.toThrow(
        WalletCannotBeDeletedException,
      );

      expect(mockGetByUserAndWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteByUserAndWalletRepository).toHaveBeenCalledTimes(0);
    });
  });
});
