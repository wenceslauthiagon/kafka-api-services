import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { RedisKey, RedisService, defaultLogger as logger } from '@zro/common';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { StreamQuotationFactory } from '@zro/test/quotations/config';
import { GetStreamQuotationByBaseCurrencyMicroserviceController as Controller } from '@zro/quotations/infrastructure';
import { GetStreamQuotationByBaseCurrencyRequest } from '@zro/quotations/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetStreamQuotationByBaseCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const redisService: RedisService = createMock<RedisService>();
  const mockSearchRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.search),
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

  describe('GetByBaseCurrency', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get stream quotation successfully', async () => {
        const data1 =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
          );
        const data2 =
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
          );
        const keys: RedisKey[] = [
          { key: 'BTC', data: data1, ttl: 1 },
          { key: 'BRL', data: data2, ttl: 1 },
        ];

        mockSearchRedisService.mockResolvedValue(keys);

        const baseCurrencySymbol = 'BTC';
        const message: GetStreamQuotationByBaseCurrencyRequest = {
          baseCurrencySymbol,
        };

        const result = await controller.execute(logger, message, ctx);

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.baseCurrency).toBeDefined();
        expect(result.value.quoteCurrency).toBeDefined();
        expect(result.value.buy).toBeDefined();
        expect(result.value.sell).toBeDefined();
        expect(result.value.streamPair).toBeDefined();
        expect(result.value.timestamp).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
