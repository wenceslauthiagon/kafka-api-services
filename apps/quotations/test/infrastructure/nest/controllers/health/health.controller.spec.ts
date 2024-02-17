import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisKey, RedisService } from '@zro/common';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import { HealthController as Controller } from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

describe('HealthController', () => {
  let module: TestingModule;
  let controller: Controller;

  const redisService: RedisService = createMock<RedisService>();
  const mockSearchRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.search),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('execute', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should quotation be up when get all quotations returns a not empty value', async () => {
        const data = await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

        const keys: RedisKey[] = [{ key: 'BTC|BRL', data }];

        mockSearchRedisService.mockResolvedValue(keys);

        const result = await controller.execute();

        expect(result).toBeDefined();
        expect(result.info['QUOTATION'].status).toBe('up');
        expect(mockSearchRedisService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should quotation be down when get all quotations return a empty value', async () => {
        const keys: RedisKey[] = [];

        mockSearchRedisService.mockResolvedValue(keys);

        const result = await controller.execute();

        expect(result).toBeDefined();
        expect(result.info['QUOTATION'].status).toBe('down');
        expect(mockSearchRedisService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
