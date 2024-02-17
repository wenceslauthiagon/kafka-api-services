import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  CurrencyEntity,
  CurrencyRepository,
  UserWalletRepository,
  WalletAccountEntity,
  WalletAccountRepository,
  WalletEntity,
  WalletRepository,
} from '@zro/operations/domain';
import { CreatePendingWalletUseCase as UseCase } from '@zro/operations/application';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('CreatePendingWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const currencyRepository: CurrencyRepository =
      createMock<CurrencyRepository>();

    const mockCountWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.countByUserAndStateIsNotDeactivate),
    );
    const mockCreateWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.create),
    );
    const mockCreateWalletAccountRepository: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.create));
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
      mockCountWalletRepository,
      mockCreateWalletRepository,
      mockCreateWalletAccountRepository,
      mockGetCurrencyRepository,
      mockCreateUserWalletRepository,
    };
  };

  const makeSut = () => {
    const {
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
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
      ROOT,
    );

    return {
      sut,
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
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockCountWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if already exists wallets', async () => {
      const {
        sut,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockCountWalletRepository.mockResolvedValue(1);

      const { user } = wallet;

      const result = await sut.execute(user);

      expect(result).toBeUndefined();
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledWith(user);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create wallet with valid params and send notification', async () => {
      const {
        sut,
        mockCountWalletRepository,
        mockCreateWalletRepository,
        mockCreateWalletAccountRepository,
        mockGetCurrencyRepository,
        mockCreateUserWalletRepository,
      } = makeSut();

      const QUANTITY_CURRENCIES = 5;

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const { user } = wallet;

      const currencies = await CurrencyFactory.createMany<CurrencyEntity>(
        CurrencyEntity.name,
        QUANTITY_CURRENCIES,
      );

      const walletAcconts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          QUANTITY_CURRENCIES,
        );

      mockCountWalletRepository.mockResolvedValue(0);
      mockGetCurrencyRepository.mockResolvedValue(currencies);

      for (const walletAccount of walletAcconts) {
        mockCreateWalletAccountRepository.mockResolvedValueOnce(walletAccount);
      }

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(mockCountWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockCountWalletRepository).toHaveBeenCalledWith(user);
      expect(mockCreateWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateWalletAccountRepository).toHaveBeenCalledTimes(
        QUANTITY_CURRENCIES,
      );
      expect(mockCreateUserWalletRepository).toHaveBeenCalledTimes(1);
    });
  });
});
