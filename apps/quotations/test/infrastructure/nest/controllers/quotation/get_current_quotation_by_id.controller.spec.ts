import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, RedisKey, RedisService } from '@zro/common';
import { QuotationEntity } from '@zro/quotations/domain';
import { GetCurrentQuotationByIdMicroserviceController as Controller } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { QuotationFactory } from '@zro/test/quotations/config';
import { GetCurrentQuotationByIdRequest } from '@zro/quotations/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetCurrentQuotationByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetCurrentQuotationById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get quotation by id successfully', async () => {
        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
        );
        const keys: RedisKey = { key: '1', data: quotation, ttl: 1 };
        mockGetRedisService.mockResolvedValue(keys);

        const message: GetCurrentQuotationByIdRequest = {
          id: quotation.id,
        };

        const result = await controller.execute(logger, message, ctx);

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(quotation.id);
        expect(result.value.price).toBe(quotation.price);
        expect(result.value.priceBuy).toBe(quotation.priceBuy);
        expect(result.value.priceSell).toBe(quotation.priceSell);
        expect(result.value.side).toBe(quotation.side);
        expect(result.value.partialBuy).toBe(quotation.partialBuy);
        expect(result.value.partialSell).toBe(quotation.partialSell);
        expect(result.value.iofAmount).toBe(quotation.iofAmount);
        expect(result.value.spreadIds.length).toBe(quotation.spreads.length);
        expect(result.value.spreadIds).toMatchObject(
          quotation.spreads.map(({ id }) => id),
        );
        expect(result.value.spreadBuy).toBe(quotation.spreadBuy);
        expect(result.value.spreadSell).toBe(quotation.spreadSell);
        expect(result.value.spreadAmountBuy).toBe(quotation.spreadAmountBuy);
        expect(result.value.spreadAmountSell).toBe(quotation.spreadAmountSell);
        expect(result.value.quoteAmountBuy).toBe(quotation.quoteAmountBuy);
        expect(result.value.quoteAmountSell).toBe(quotation.quoteAmountSell);
        expect(result.value.quoteCurrencyId).toBe(quotation.quoteCurrency.id);
        expect(result.value.quoteCurrencySymbol).toBe(
          quotation.quoteCurrency.symbol,
        );
        expect(result.value.baseAmountBuy).toBe(quotation.baseAmountBuy);
        expect(result.value.baseAmountSell).toBe(quotation.baseAmountSell);
        expect(result.value.baseCurrencyId).toBe(quotation.baseCurrency.id);
        expect(result.value.baseCurrencySymbol).toBe(
          quotation.baseCurrency.symbol,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
