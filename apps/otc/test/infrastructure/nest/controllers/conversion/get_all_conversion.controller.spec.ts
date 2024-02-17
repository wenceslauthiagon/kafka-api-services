import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { ConversionRepository } from '@zro/otc/domain';
import {
  ConversionModel,
  GetAllConversionMicroserviceController as Controller,
  ConversionDatabaseRepository,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetAllConversionRequest,
  GetAllConversionRequestSort,
} from '@zro/otc/interface';
import { CurrencyFactory } from '@zro/test/operations/config';
import { ConversionFactory } from '@zro/test/otc/config';
import { QuotationFactory } from '@zro/test/quotations/config';
import { QuotationEntity } from '@zro/quotations/domain';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllConversionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let conversionRepository: ConversionRepository;

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetQuotationById: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotationById),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockGetCurrencyById: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    conversionRepository = new ConversionDatabaseRepository();
  });

  describe('GetAllConversion', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get conversions successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
        );

        const conversion = await ConversionFactory.create<ConversionModel>(
          ConversionModel.name,
          { userUUID: uuidV4(), currencyId: currency.id },
        );

        mockGetCurrencyById.mockResolvedValue(currency);
        mockGetQuotationById.mockResolvedValue(quotation);

        const message: GetAllConversionRequest = {
          userId: conversion.userUUID,
        };

        const result = await controller.execute(
          conversionRepository,
          operationService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.operationId).toBeDefined();
          expect(res.quotationId).toBeDefined();
          expect(res.currencyId).toBeDefined();
          expect(res.currencyTitle).toBeDefined();
          expect(res.currencySymbol).toBeDefined();
          expect(res.currencyDecimal).toBeDefined();
          expect(res.side).toBeDefined();
          expect(res.clientName).toBeDefined();
          expect(res.clientDocument).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.quote).toBeDefined();
          expect(res.priceBuy).toBe(quotation.priceBuy);
          expect(res.priceSell).toBe(quotation.priceSell);
          expect(res.quoteAmountBuy).toBe(quotation.quoteAmountBuy);
          expect(res.quoteAmountSell).toBe(quotation.quoteAmountSell);
          expect(res.quoteCurrencyDecimal).toBe(
            quotation.quoteCurrency.decimal,
          );
          expect(res.baseAmountBuy).toBe(quotation.baseAmountBuy);
          expect(res.baseAmountSell).toBe(quotation.baseAmountSell);
          expect(res.baseCurrencyDecimal).toBe(quotation.baseCurrency.decimal);
          expect(res.createdAt).toBeDefined();
        });
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
        expect(mockGetQuotationById).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should get conversions successfully with pagination sort', async () => {
        const conversion = await ConversionFactory.create<ConversionModel>(
          ConversionModel.name,
          { userUUID: uuidV4(), currencyId: null },
        );

        mockGetQuotationById.mockResolvedValue(null);

        const message: GetAllConversionRequest = {
          userId: conversion.userUUID,
          sort: GetAllConversionRequestSort.CREATED_AT,
          pageSize: 2,
        };

        const result = await controller.execute(
          conversionRepository,
          operationService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.operationId).toBeDefined();
          expect(res.quotationId).toBeUndefined();
          expect(res.currencyId).toBeUndefined();
          expect(res.currencyTitle).toBeUndefined();
          expect(res.currencySymbol).toBeUndefined();
          expect(res.currencyDecimal).toBeUndefined();
          expect(res.side).toBeDefined();
          expect(res.clientName).toBeDefined();
          expect(res.clientDocument).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.quote).toBeDefined();
          expect(res.priceBuy).toBeUndefined();
          expect(res.priceSell).toBeUndefined();
          expect(res.quoteAmountBuy).toBeUndefined();
          expect(res.quoteAmountSell).toBeUndefined();
          expect(res.quoteCurrencyDecimal).toBeUndefined();
          expect(res.baseAmountBuy).toBeUndefined();
          expect(res.baseAmountSell).toBeUndefined();
          expect(res.createdAt).toBeDefined();
        });
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
        expect(mockGetQuotationById).toHaveBeenCalledTimes(2);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should get conversions with incorrect userId', async () => {
        const message: GetAllConversionRequest = {
          userId: 'x',
        };

        const testScript = () =>
          controller.execute(
            conversionRepository,
            operationService,
            quotationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
