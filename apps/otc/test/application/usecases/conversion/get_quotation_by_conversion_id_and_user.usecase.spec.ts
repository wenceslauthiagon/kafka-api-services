import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  GetQuotationByConversionIdAndUserUseCase as UseCase,
  QuotationService,
} from '@zro/otc/application';
import {
  ConversionDatabaseRepository,
  ConversionModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ConversionFactory } from '@zro/test/otc/config';

describe('GetQuotationByConversionIdAndUserUseCase', () => {
  let module: TestingModule;
  const quotationRepository = new ConversionDatabaseRepository();

  const quotationService: QuotationService = createMock<QuotationService>();
  const mockGetQuotationById: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotationById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get quotation by user and conversion id successfully', async () => {
      const conversion = await ConversionFactory.create<ConversionModel>(
        ConversionModel.name,
        { quotationId: null },
      );

      const usecase = new UseCase(
        logger,
        quotationRepository,
        quotationService,
      );

      const user = new UserEntity({ uuid: conversion.userUUID });
      const result = await usecase.execute(user, conversion.id);

      expect(result).toBeUndefined();
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get quotation by different conversion id', async () => {
      const usecase = new UseCase(
        logger,
        quotationRepository,
        quotationService,
      );

      const user = new UserEntity({ uuid: uuidV4() });
      const result = await usecase.execute(user, uuidV4());

      expect(result).toBeUndefined();
      expect(mockGetQuotationById).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
