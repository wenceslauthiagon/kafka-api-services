import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  PaginationEntity,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import { ConversionRepository, TGetConversionFilter } from '@zro/otc/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  GetAllConversionUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc/application';
import {
  ConversionDatabaseRepository,
  ConversionModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ConversionFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { QuotationFactory } from '@zro/test/quotations/config';

describe('GetAllConversionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  let module: TestingModule;
  let conversionRepository: ConversionRepository;

  const quotationService: QuotationService = createMock<QuotationService>();
  const mockGetQuotationById: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotationById),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockGetCurrencyById: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    conversionRepository = new ConversionDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get all conversions successfully when not exists currency ID', async () => {
      const userUUID = uuidV4();

      await ConversionFactory.createMany<ConversionModel>(
        ConversionModel.name,
        2,
        { userUUID, currencyId: null, quotationId: null },
      );

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = {};

      const result = await usecase.execute(user, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
        expect(res.quotation).toBeNull();
        expect(res.currency).toBeNull();
        expect(res.conversionType).toBeDefined();
        expect(res.clientName).toBeDefined();
        expect(res.clientDocument).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.quote).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should get conversions filtered by quotationID and with currencyID successfully', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { userUUID: uuidV4() },
      );

      mockGetCurrencyById.mockResolvedValue(currency);
      mockGetQuotationById.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = {
        quotationId: conversion.quotationId,
      };

      const result = await usecase.execute(user, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
        expect(res.quotation).toBeNull();
        expect(res.currency.id).toBeDefined();
        expect(res.currency.title).toBeDefined();
        expect(res.currency.symbol).toBeDefined();
        expect(res.currency.decimal).toBeDefined();
        expect(res.conversionType).toBeDefined();
        expect(res.clientName).toBeDefined();
        expect(res.clientDocument).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.quote).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get conversions filtered by currencySymbol successfully', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { userUUID: uuidV4() },
      );

      mockGetCurrencyBySymbol.mockResolvedValue(currency);

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = { currencySymbol: currency.symbol };

      const result = await usecase.execute(user, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
        expect(res.quotation.id).toBeDefined();
        expect(res.currency.id).toBeDefined();
        expect(res.currency.title).toBeDefined();
        expect(res.currency.symbol).toBeDefined();
        expect(res.currency.decimal).toBeDefined();
        expect(res.conversionType).toBeDefined();
        expect(res.clientName).toBeDefined();
        expect(res.clientDocument).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.quote).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should get all conversions successfully with range date filter', async () => {
      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        {
          userUUID: uuidV4(),
          createdAt: getMoment().add(5, 'day').toDate(),
          currencyId: null,
        },
      );

      mockGetQuotationById.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = {
        createdAtStart: getMoment().toDate(),
        createdAtEnd: getMoment().add(6, 'day').toDate(),
      };

      const result = await usecase.execute(user, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
        expect(res.quotation).toBeNull();
        expect(res.currency).toBeNull();
        expect(res.conversionType).toBeDefined();
        expect(res.clientName).toBeDefined();
        expect(res.clientDocument).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.quote).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should get conversions with quotation successfully', async () => {
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { userUUID: uuidV4(), currencyId: null },
      );

      mockGetQuotationById.mockResolvedValue(quotation);

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = {};

      const result = await usecase.execute(user, pagination, filter);

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
        expect(res.operation.id).toBeDefined();
        expect(res.quotation.id).toBe(quotation.id);
        expect(res.quotation).toMatchObject(quotation);
        expect(res.currency).toBeNull();
        expect(res.conversionType).toBeDefined();
        expect(res.clientName).toBeDefined();
        expect(res.clientDocument).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.quote).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0006 - Should not get all conversions when filter by currency symbol but not exists currency', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { userUUID: uuidV4() },
      );

      mockGetCurrencyBySymbol.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const pagination = new PaginationEntity();
      const filter: TGetConversionFilter = { currencySymbol: currency.symbol };

      const testScript = () => usecase.execute(user, pagination, filter);
      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);

      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
