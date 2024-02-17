import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import { HistoricalCryptoPriceGateway } from '@zro/otc/application';
import { GetCryptoPriceByCurrencyAndDateRequest } from '@zro/otc/interface';
import {
  GetCryptoPriceByCurrencyAndDateMicroserviceController as Controller,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

describe('GetCryptoPriceByCurrencyAndDateMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const historicalCryptoPriceGateway: HistoricalCryptoPriceGateway =
    createMock<HistoricalCryptoPriceGateway>();
  const mockGetHistoricalCryptoPrice: jest.Mock = On(
    historicalCryptoPriceGateway,
  ).get(method((mock) => mock.getHistoricalCryptoPrice));

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetQuotation: jest.Mock = On(quotationService).get(
    method((mock) => mock.getStreamQuotationByBaseCurrency),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get crypto price successfully if is today', async () => {
      const crypto = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const quotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      const message: GetCryptoPriceByCurrencyAndDateRequest = {
        currencySymbol: crypto.symbol,
        date: new Date(),
      };

      mockGetQuotation.mockResolvedValueOnce(quotation);

      const result = await controller.execute(
        logger,
        message,
        quotationService,
        historicalCryptoPriceGateway,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should get crypto price successfully if is not today', async () => {
      const crypto = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetHistoricalCryptoPrice.mockResolvedValueOnce({
        estimatedPrice: faker.datatype.number(),
      });

      const message: GetCryptoPriceByCurrencyAndDateRequest = {
        currencySymbol: crypto.symbol,
        date: faker.date.past(1, new Date()),
      };

      const result = await controller.execute(
        logger,
        message,
        quotationService,
        historicalCryptoPriceGateway,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetHistoricalCryptoPrice).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
