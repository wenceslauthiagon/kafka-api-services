import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CurrencyEntity,
  UserLimitEntity,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import {
  GetConversionCreditByUserUseCase as UseCase,
  OperationService,
  QuotationService,
  WalletsNotFoundException,
} from '@zro/otc/application';
import { QuotationNotFoundException } from '@zro/quotations/application';
import { UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  UserLimitFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('GetConversionCreditByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
    const mockGetLimitTypesByFilter: jest.Mock = On(operationService).get(
      method((mock) => mock.getLimitTypesByFilter),
    );
    const mockGetUserLimitsByFilter: jest.Mock = On(operationService).get(
      method((mock) => mock.getUserLimitsByFilter),
    );
    const mockGetAllActiveCurrencies: jest.Mock = On(operationService).get(
      method((mock) => mock.getAllActiveCurrencies),
    );
    const mockGetWalletsByUser: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletsByUser),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getQuotation),
    );

    return {
      operationService,
      mockGetWalletAccountByUserAndCurrency,
      quotationService,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
      mockGetQuotation,
      mockGetWalletsByUser,
    };
  };

  const makeSut = () => {
    const conversionTransactionTag = 'CONV';
    const conversionSymbolCurrencyReal = 'BRL';

    const {
      operationService,
      quotationService,
      mockGetWalletAccountByUserAndCurrency,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
      mockGetQuotation,
      mockGetWalletsByUser,
    } = mockService();

    const sut = new UseCase(
      logger,
      operationService,
      quotationService,
      conversionTransactionTag,
      conversionSymbolCurrencyReal,
    );

    return {
      sut,
      mockGetWalletAccountByUserAndCurrency,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
      mockGetQuotation,
      mockGetWalletsByUser,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const test = [
        () => sut.execute(null),
        () => sut.execute(new UserEntity({})),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
        expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(0);
        expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(0);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(0);
        expect(mockGetQuotation).toHaveBeenCalledTimes(0);
        expect(mockGetWalletsByUser).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should not get if quotation not found', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000, state: WalletAccountState.ACTIVE },
        );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(undefined);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const testScript = () => sut.execute(user);

      await expect(testScript).rejects.toThrow(QuotationNotFoundException);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });

    it('TC0003 - Should not get if wallets not found', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000 },
        );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, partialBuy: 10000000 },
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([]);

      const testScript = () => sut.execute(user);

      await expect(testScript).rejects.toThrow(WalletsNotFoundException);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });

    it('TC0004 - Should not get if wallet account not found', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, partialBuy: 10000000 },
      );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(undefined);

      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result.creditBalance).toBeDefined();
      expect(result.liability).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should get with valid parameters', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, quoteAmountBuy: 1000 },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000, state: WalletAccountState.ACTIVE },
        );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result.creditBalance).toBeDefined();
      expect(result.liability).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });

    it('TC0006 - Should get with valid parameters using balance BRL', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { symbol: 'BRL' },
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, quoteAmountBuy: 1000 },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000 },
        );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result.creditBalance).toBeDefined();
      expect(result.liability).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });

    it('TC0007 - Should get successfully but dont set creditBalance if limitType not exists', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, quoteAmountBuy: 1000 },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000, state: WalletAccountState.ACTIVE },
        );
      const userLimit = await UserLimitFactory.create<UserLimitEntity>(
        UserLimitEntity.name,
        { creditBalance: 50000 },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([]);
      mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result.creditBalance).toBe(0);
      expect(result.liability).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });

    it('TC0008 - Should get successfully but dont set creditBalance if userLimit not exists', async () => {
      const {
        sut,
        mockGetWalletAccountByUserAndCurrency,
        mockGetLimitTypesByFilter,
        mockGetUserLimitsByFilter,
        mockGetAllActiveCurrencies,
        mockGetQuotation,
        mockGetWalletsByUser,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, quoteAmountBuy: 1000 },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: -1000, state: WalletAccountState.ACTIVE },
        );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetLimitTypesByFilter.mockResolvedValue([{}]);
      mockGetUserLimitsByFilter.mockResolvedValue([]);
      mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
      mockGetQuotation.mockResolvedValueOnce(quotation);
      mockGetWalletsByUser.mockResolvedValue([wallet]);

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result.creditBalance).toBe(0);
      expect(result.liability).toBeDefined();
      expect(result.user).toBeDefined();
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      expect(mockGetWalletsByUser).toHaveBeenCalledWith(user);
    });
  });
});
