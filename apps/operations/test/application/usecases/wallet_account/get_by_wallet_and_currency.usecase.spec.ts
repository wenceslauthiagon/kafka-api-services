import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  CurrencyEntity,
  CurrencyRepository,
  WalletAccountEntity,
  WalletAccountRepository,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import {
  CurrencyNotFoundException,
  GetWalletAccountByWalletAndCurrencyUseCase as UseCase,
} from '@zro/operations/application';
import {
  CurrencyFactory,
  WalletFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';

describe('GetWalletAccountByWalletAndCurrencyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      walletAccountRepository,
      mockGetByWalletAndCurrencyRepository,
      currencyRepository,
      mockGetByTagRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      walletAccountRepository,
      currencyRepository,
    );
    return {
      sut,
      mockGetByWalletAndCurrencyRepository,
      mockGetByTagRepository,
    };
  };

  const mockRepository = () => {
    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockGetByWalletAndCurrencyRepository: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.getByWalletAndCurrency));

    const currencyRepository: CurrencyRepository =
      createMock<CurrencyRepository>();
    const mockGetByTagRepository: jest.Mock = On(currencyRepository).get(
      method((mock) => mock.getByTag),
    );

    return {
      walletAccountRepository,
      mockGetByWalletAndCurrencyRepository,
      currencyRepository,
      mockGetByTagRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get wallet account if missing data', async () => {
      const {
        sut,
        mockGetByWalletAndCurrencyRepository,
        mockGetByTagRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(wallet, null),
        () => sut.execute(null, currency),
        () => sut.execute(new WalletEntity({}), currency),
        () => sut.execute(wallet, new CurrencyEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByWalletAndCurrencyRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByTagRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get wallet account if currency not found', async () => {
      const {
        sut,
        mockGetByWalletAndCurrencyRepository,
        mockGetByTagRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetByTagRepository.mockResolvedValueOnce(null);

      const test = () => sut.execute(wallet, currency);

      await expect(test).rejects.toThrow(CurrencyNotFoundException);

      expect(mockGetByTagRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAndCurrencyRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should get wallet account successfully ', async () => {
      const {
        sut,
        mockGetByWalletAndCurrencyRepository,
        mockGetByTagRepository,
      } = makeSut();

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetByTagRepository.mockResolvedValueOnce(walletAccount.currency);

      mockGetByWalletAndCurrencyRepository.mockResolvedValueOnce(walletAccount);

      const result = await sut.execute(
        walletAccount.wallet,
        walletAccount.currency,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(walletAccount.id);
      expect(result.wallet.uuid).toBe(walletAccount.wallet.uuid);
      expect(result.currency.id).toBe(walletAccount.currency.id);
      expect(mockGetByWalletAndCurrencyRepository).toBeCalledWith(
        walletAccount.wallet,
        walletAccount.currency,
      );
      expect(mockGetByWalletAndCurrencyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByTagRepository).toHaveBeenCalledTimes(1);
    });
  });
});
