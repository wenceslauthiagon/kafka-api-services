import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  GetConversionByUserAndIdUseCase as UseCase,
  OperationService,
  QuotationService,
} from '@zro/otc/application';
import {
  ConversionDatabaseRepository,
  ConversionModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ConversionFactory } from '@zro/test/otc/config';

describe('GetConversionByUserAndIdUseCase', () => {
  let module: TestingModule;
  const conversionRepository = new ConversionDatabaseRepository();

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyById: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyById),
  );

  const quotationService: QuotationService = createMock<QuotationService>();
  const mockGetQuotationById: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotationById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get conversion by user and id successfully', async () => {
      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { currencyId: null, quotationId: null },
      );

      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const result = await usecase.execute(user, conversion.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(conversion.id);
      expect(result.amount).toBe(conversion.amount);
      expect(result.user.uuid).toBe(conversion.userUUID);
      expect(result.provider.id).toBe(conversion.providerId);
      expect(result.currency).toBeUndefined();
      expect(result.quotation).toBeUndefined();
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get conversion by different id', async () => {
      const usecase = new UseCase(
        logger,
        conversionRepository,
        operationService,
        quotationService,
      );

      const user = new UserEntity({ uuid: uuidV4() });
      const result = await usecase.execute(user, uuidV4());

      expect(result).toBeNull();
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
