import axios from 'axios';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import {
  CryptoReportEntity,
  CryptoReportRepository,
  CryptoReportFormatType,
} from '@zro/otc/domain';
import {
  GetCryptoReportByCurrencyAndFormatUseCase as UseCase,
  StorageService,
  UserService,
  OperationService,
  HistoricalCryptoPriceGateway,
  HistoricalCryptoPriceGatewayException,
  CryptoTransactionsNotFoundException,
  QuotationService,
} from '@zro/otc/application';
import { UserNotFoundException } from '@zro/users/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';
import { UserFactory } from '@zro/test/users/config';
import { CryptoReportFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

jest.mock('axios');

describe('GetCryptoReportByCurrencyAndFormatUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const zrobankLogoUrl = 'test';

    const storageService: StorageService = createMock<StorageService>();
    const mockUploadFile: jest.Mock = On(storageService).get(
      method((mock) => mock.uploadFile),
    );

    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuid: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );

    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getStreamQuotationByBaseCurrency),
    );

    const historicalCryptoPriceGateway: HistoricalCryptoPriceGateway =
      createMock<HistoricalCryptoPriceGateway>();
    const mockGetHistoricalCryptoPrice: jest.Mock = On(
      historicalCryptoPriceGateway,
    ).get(method((mock) => mock.getHistoricalCryptoPrice));

    const cryptoReportRepository: CryptoReportRepository =
      createMock<CryptoReportRepository>();
    const mockGetAllByUserAndCurrency: jest.Mock = On(
      cryptoReportRepository,
    ).get(method((mock) => mock.getAllByUserAndCurrency));
    const mockUpdate: jest.Mock = On(cryptoReportRepository).get(
      method((mock) => mock.update),
    );

    const sut = new UseCase(
      logger,
      storageService,
      axios,
      userService,
      operationService,
      quotationService,
      cryptoReportRepository,
      historicalCryptoPriceGateway,
      zrobankLogoUrl,
    );

    return {
      sut,
      mockUploadFile,
      mockGetUserByUuid,
      mockGetCurrencyBySymbol,
      mockGetHistoricalCryptoPrice,
      mockGetAllByUserAndCurrency,
      mockUpdate,
      mockGetQuotation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      const test = [
        () => sut.execute(null, null, null, null, null),
        () => sut.execute(user, null, null, null, null),
        () => sut.execute(null, currency, null, null, null),
        () => sut.execute(null, null, format, null, null),
        () => sut.execute(null, null, null, createdAtStart, null),
        () => sut.execute(null, null, null, null, createdAtEnd),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw UserNotFoundException if user is not found', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      mockGetUserByUuid.mockResolvedValueOnce(null);

      const test = () =>
        sut.execute(user, currency, format, createdAtStart, createdAtEnd);

      await expect(test).rejects.toThrow(UserNotFoundException);

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw CurrencyNotFoundException if currency is not found', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(null);

      const test = () =>
        sut.execute(user, currency, format, createdAtStart, createdAtEnd);

      await expect(test).rejects.toThrow(CurrencyNotFoundException);

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw CryptoTransactionsNotFoundException if crypto transactions are not found', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetAllByUserAndCurrency.mockResolvedValueOnce([]);

      const test = () =>
        sut.execute(user, currency, format, createdAtStart, createdAtEnd);

      await expect(test).rejects.toThrow(CryptoTransactionsNotFoundException);

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw HistoricalCryptoPriceGatewayException if no estimated price is found', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      const transactions =
        await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          { createdAt: createdAtStart },
        );

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetAllByUserAndCurrency.mockResolvedValue(transactions);
      mockGetHistoricalCryptoPrice.mockResolvedValueOnce(null);

      const test = () =>
        sut.execute(user, currency, format, createdAtStart, createdAtEnd);

      await expect(test).rejects.toThrow(HistoricalCryptoPriceGatewayException);

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(1);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw StreamQuotationNotFoundException if no quotation is found', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      const transactions =
        await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          { createdAt: new Date() },
        );

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetAllByUserAndCurrency.mockResolvedValue(transactions);
      mockGetQuotation.mockResolvedValueOnce(null);

      const test = () =>
        sut.execute(user, currency, format, createdAtStart, createdAtEnd);

      await expect(test).rejects.toThrow(StreamQuotationNotFoundException);

      expect(mockUploadFile).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should generate PDF statement successfully', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.PDF;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      const transactions =
        await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          { createdAt: new Date() },
        );

      const quotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetAllByUserAndCurrency.mockResolvedValue(transactions);
      mockGetQuotation.mockResolvedValue(quotation);

      const file = await sut.execute(
        user,
        currency,
        format,
        createdAtStart,
        createdAtEnd,
      );

      expect(file).toBeDefined();
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockGetQuotation).toHaveBeenCalledTimes(2);
    });

    it('TC0008 - Should generate XLSX statement successfully', async () => {
      const {
        sut,
        mockUploadFile,
        mockGetUserByUuid,
        mockGetCurrencyBySymbol,
        mockGetHistoricalCryptoPrice,
        mockGetAllByUserAndCurrency,
        mockUpdate,
        mockGetQuotation,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const format = CryptoReportFormatType.XLSX;

      const createdAtStart = getMoment().subtract(1, 'year').toDate();

      const createdAtEnd = new Date();

      const transactions =
        await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          { createdAt: createdAtStart },
        );

      const gatewayResponse = {
        estimatedPrice: faker.datatype.number(100000),
      };

      mockGetUserByUuid.mockResolvedValueOnce(user);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetAllByUserAndCurrency.mockResolvedValue(transactions);
      mockGetHistoricalCryptoPrice.mockResolvedValue(gatewayResponse);

      const file = await sut.execute(
        user,
        currency,
        format,
        createdAtStart,
        createdAtEnd,
      );

      expect(file).toBeDefined();
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(2);
      expect(mockGetAllByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });
  });
});
