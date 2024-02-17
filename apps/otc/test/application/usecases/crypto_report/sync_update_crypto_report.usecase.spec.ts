import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { getMoment, defaultLogger as logger } from '@zro/common';
import {
  HistoricalCryptoPriceGateway,
  OperationService,
  QuotationService,
  SyncUpdateCryptoReportUseCase as UseCase,
} from '@zro/otc/application';
import {
  CryptoReportCurrentPageRepository,
  CryptoReportEntity,
  CryptoReportRepository,
} from '@zro/otc/domain';
import { CryptoReportFactory } from '@zro/test/otc/config';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { UserEntity } from '@zro/users/domain';
import { StreamQuotationFactory } from '@zro/test/quotations/config';
import { StreamQuotationEntity } from '@zro/quotations/domain';

describe('SyncUpdateCryptoReportUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const historicalCryptoPriceGateway: HistoricalCryptoPriceGateway =
    createMock<HistoricalCryptoPriceGateway>();
  const mockGetHistoricalCryptoPrice: jest.Mock = On(
    historicalCryptoPriceGateway,
  ).get(method((mock) => mock.getHistoricalCryptoPrice));

  const cryptoReportCurrentPageRepository: CryptoReportCurrentPageRepository =
    createMock<CryptoReportCurrentPageRepository>();
  const mockGetCurrentPage: jest.Mock = On(
    cryptoReportCurrentPageRepository,
  ).get(method((mock) => mock.getCurrentPage));
  const mockCreateOrUpdate: jest.Mock = On(
    cryptoReportCurrentPageRepository,
  ).get(method((mock) => mock.createOrUpdate));

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyById: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  const quotationService: QuotationService = createMock<QuotationService>();
  const mockGetQuotation: jest.Mock = On(quotationService).get(
    method((mock) => mock.getStreamQuotationByBaseCurrency),
  );

  const cryptoReportRepository: CryptoReportRepository =
    createMock<CryptoReportRepository>();
  const mockUpdate: jest.Mock = On(cryptoReportRepository).get(
    method((mock) => mock.update),
  );
  const mockGetAllFromDate: jest.Mock = On(cryptoReportRepository).get(
    method((mock) => mock.getAllFromDate),
  );
  const mockGetLastBeforeDateByUserAndCurrency: jest.Mock = On(
    cryptoReportRepository,
  ).get(method((mock) => mock.getLastBeforeDateByUserAndCurrency));

  const makeSut = () => {
    const pageSize = 100;

    const sut = new UseCase(
      logger,
      cryptoReportRepository,
      cryptoReportCurrentPageRepository,
      historicalCryptoPriceGateway,
      operationService,
      quotationService,
      pageSize,
    );
    return {
      sut,
      mockGetHistoricalCryptoPrice,
      mockGetCurrentPage,
      mockCreateOrUpdate,
      mockGetCurrencyById,
      mockUpdate,
      mockGetAllFromDate,
      mockGetLastBeforeDateByUserAndCurrency,
      mockGetQuotation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should return if no new transactions are found.', async () => {
      const {
        sut,
        mockGetHistoricalCryptoPrice,
        mockGetCurrentPage,
        mockCreateOrUpdate,
        mockGetCurrencyById,
        mockUpdate,
        mockGetAllFromDate,
        mockGetLastBeforeDateByUserAndCurrency,
        mockGetQuotation,
      } = makeSut();

      mockGetCurrentPage.mockResolvedValueOnce(null);
      mockGetAllFromDate.mockResolvedValueOnce(null);

      await sut.execute();

      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentPage).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetAllFromDate).toHaveBeenCalledTimes(1);
      expect(mockGetLastBeforeDateByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw CurrencyNotFoundException if currency is not found.', async () => {
      const {
        sut,
        mockGetHistoricalCryptoPrice,
        mockGetCurrentPage,
        mockCreateOrUpdate,
        mockGetCurrencyById,
        mockUpdate,
        mockGetAllFromDate,
        mockGetLastBeforeDateByUserAndCurrency,
        mockGetQuotation,
      } = makeSut();

      const reports = {
        data: await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
        ),
        page: 1,
        pageSize: 100,
        pageTotal: 2,
        total: 2,
      };

      mockGetCurrentPage.mockResolvedValueOnce(null);
      mockGetAllFromDate.mockResolvedValueOnce(reports);
      mockGetCurrencyById.mockResolvedValue(null);

      const test = () => sut.execute();

      await expect(test).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentPage).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockGetAllFromDate).toHaveBeenCalledTimes(1);
      expect(mockGetLastBeforeDateByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should update first page of crypto reports with different users', async () => {
      const {
        sut,
        mockGetHistoricalCryptoPrice,
        mockGetCurrentPage,
        mockCreateOrUpdate,
        mockGetCurrencyById,
        mockUpdate,
        mockGetAllFromDate,
        mockGetLastBeforeDateByUserAndCurrency,
        mockGetQuotation,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const reports = {
        data: await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          {
            createdAt: getMoment().subtract(1, 'month').toDate(),
          },
        ),
        page: 1,
        pageSize: 100,
        pageTotal: 2,
        total: 2,
      };

      const gatewayResponse = {
        estimatedPrice: faker.datatype.number(100000),
      };

      mockGetCurrentPage.mockResolvedValue(null);
      mockGetAllFromDate.mockResolvedValue(reports);
      mockGetCurrencyById.mockResolvedValue(currency);
      mockGetLastBeforeDateByUserAndCurrency.mockResolvedValue(null);
      mockGetHistoricalCryptoPrice.mockResolvedValue(gatewayResponse);

      await sut.execute();

      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(2);
      expect(mockGetCurrentPage).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockGetAllFromDate).toHaveBeenCalledTimes(1);
      expect(mockGetLastBeforeDateByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should update first page of crypto reports with same users', async () => {
      const {
        sut,
        mockGetHistoricalCryptoPrice,
        mockGetCurrentPage,
        mockCreateOrUpdate,
        mockGetCurrencyById,
        mockUpdate,
        mockGetAllFromDate,
        mockGetLastBeforeDateByUserAndCurrency,
        mockGetQuotation,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const reports = {
        data: await CryptoReportFactory.createMany<CryptoReportEntity>(
          CryptoReportEntity.name,
          2,
          {
            crypto: currency,
            user,
            createdAt: getMoment().toDate(),
          },
        ),
        page: 1,
        pageSize: 100,
        pageTotal: 2,
        total: 2,
      };

      const quotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetCurrentPage.mockResolvedValue(null);
      mockGetAllFromDate.mockResolvedValue(reports);
      mockGetCurrencyById.mockResolvedValue(currency);
      mockGetLastBeforeDateByUserAndCurrency.mockResolvedValue(null);
      mockGetQuotation.mockResolvedValue(quotation);

      await sut.execute();

      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentPage).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockGetAllFromDate).toHaveBeenCalledTimes(1);
      expect(mockGetLastBeforeDateByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(2);
    });
  });
});
