import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WalletEntity,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  UpdateWalletByUuidAndUserUseCase as UseCase,
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';
import { WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('UpdateWalletByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      walletRepository,
      mockGetWalletByUuidRepository,
      mockUpdateWalletRepository,
    } = mockRepository();

    const sut = new UseCase(logger, walletRepository);

    return { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository };
  };

  const mockRepository = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();

    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockUpdateWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.update),
    );

    return {
      walletRepository,
      mockGetWalletByUuidRepository,
      mockUpdateWalletRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create wallet if missing params', async () => {
      const { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository } =
        makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(uuidV4(), null, null),
        () => sut.execute(uuidV4(), uuidV4(), null),
        () => sut.execute(null, uuidV4(), user),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if wallet not found', async () => {
      const { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository } =
        makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletByUuidRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(wallet.uuid, wallet.name, wallet.user);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if other user has the wallet found', async () => {
      const { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository } =
        makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(wallet.uuid, wallet.name, user);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if it is a deactivate wallet', async () => {
      const { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository } =
        makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.DEACTIVATE },
      );
      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () =>
        sut.execute(wallet.uuid, wallet.name, wallet.user);

      await expect(testScript).rejects.toThrow(WalletNotActiveException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should update wallet with valid params', async () => {
      const { sut, mockGetWalletByUuidRepository, mockUpdateWalletRepository } =
        makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockUpdateWalletRepository.mockImplementation((i) => i);

      const name = uuidV4();
      const result = await sut.execute(wallet.uuid, name, wallet.user);

      expect(result).toMatchObject({ ...wallet, name });
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(1);
    });
  });
});
