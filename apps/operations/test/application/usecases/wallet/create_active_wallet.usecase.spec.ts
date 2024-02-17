import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  MissingDataException,
  ForbiddenException,
} from '@zro/common';
import {
  CurrencyEntity,
  CurrencyRepository,
  UserWalletRepository,
  WalletAccountRepository,
  WalletEntity,
  WalletRepository,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CreateActiveWalletUseCase as UseCase,
  WalletMaxNumberException,
} from '@zro/operations/application';
import { CurrencyFactory, WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('CreateActiveWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const WALLET_MAX_NUMBER = 3;
    const {
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      mockGetWalletByUuidRepository,
      mockCountWalletRepository,
      mockCreateWalletRepository,
      mockCreateWalletAccountRepository,
      mockGetCurrencyRepository,
      mockCreateUserWalletRepository,
    } = mockRepository();

    const ROOT = 'ROOT';

    const sut = new UseCase(
      logger,
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      WALLET_MAX_NUMBER,
      ROOT,
    );

    return {
      sut,
      WALLET_MAX_NUMBER,
      mockGetWalletByUuidRepository,
      mockCountWalletRepository,
      mockCreateWalletRepository,
      mockCreateWalletAccountRepository,
      mockGetCurrencyRepository,
      mockCreateUserWalletRepository,
    };
  };

  const mockRepository = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockCreateWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.create),
    );
    const mockCountWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.countByUserAndStateIsNotDeactivate),
    );

    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockCreateWalletAccountRepository: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.create));

    const currencyRepository: CurrencyRepository =
      createMock<CurrencyRepository>();
    const mockGetCurrencyRepository: jest.Mock = On(currencyRepository).get(
      method((mock) => mock.getAll),
    );

    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockCreateUserWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.create));

    return {
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      mockGetWalletByUuidRepository,
      mockCountWalletRepository,
      mockCreateWalletRepository,
      mockCreateWalletAccountRepository,
      mockGetCurrencyRepository,
      mockCreateUserWalletRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create wallet if missing params', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(uuidV4(), null, null),
        () => sut.execute(uuidV4(), uuidV4(), null),
        () => sut.execute(uuidV4(), uuidV4(), null),
        () => sut.execute(null, null, user),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if wallet already exists', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const result = await sut.execute(wallet.uuid, wallet.name, wallet.user);

      expect(result).toMatchObject(wallet);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if the user doesnt have this wallet', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(wallet.uuid, wallet.name, user);

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if there are so many wallets', async () => {
      const {
        sut,
        WALLET_MAX_NUMBER,
        mockGetWalletByUuidRepository,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletByUuidRepository.mockResolvedValue(null);
      mockCountWalletRepository.mockResolvedValue(WALLET_MAX_NUMBER + 1);

      const testScript = () => sut.execute(wallet.uuid, wallet.name, user);

      await expect(testScript).rejects.toThrow(WalletMaxNumberException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create wallet with valid params', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const curr1 = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const curr2 = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetWalletByUuidRepository.mockResolvedValue(null);
      mockCountWalletRepository.mockResolvedValue(0);
      mockCreateWalletRepository.mockResolvedValue(wallet);
      mockGetCurrencyRepository.mockResolvedValue([curr1, curr2]);

      const result = await sut.execute(wallet.uuid, wallet.name, wallet.user);

      expect(result).toMatchObject(wallet);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(2);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(1);
    });
  });
});
