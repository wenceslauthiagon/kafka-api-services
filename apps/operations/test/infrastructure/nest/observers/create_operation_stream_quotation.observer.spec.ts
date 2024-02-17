import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  RedisService,
  defaultLogger as logger,
} from '@zro/common';
import { OperationStreamQuotationEntity } from '@zro/operations/domain';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CreateOperationStreamQuotationNestObserver as Observer } from '@zro/operations/infrastructure';
import { OperationStreamQuotationFactory } from '@zro/test/operations/config';
import { HandleCreateOperationStreamQuotationEventRequest } from '@zro/operations/interface';

describe('CreateOperationStreamQuotationNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;

  const redisService: RedisService = createMock<RedisService>();
  const mockSetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.set),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    observer = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create a Operation stream quotation successfully', async () => {
      const operationStreamQuotation =
        await OperationStreamQuotationFactory.create<OperationStreamQuotationEntity>(
          OperationStreamQuotationEntity.name,
        );

      const message: HandleCreateOperationStreamQuotationEventRequest = {
        quoteCurrencySymbol: operationStreamQuotation.quoteCurrency.symbol,
        quoteCurrencyId: operationStreamQuotation.quoteCurrency.id,
        quoteCurrencyDecimal: operationStreamQuotation.quoteCurrency.decimal,
        baseCurrencySymbol: operationStreamQuotation.baseCurrency.symbol,
        baseCurrencyId: operationStreamQuotation.baseCurrency.id,
        baseCurrencyDecimal: operationStreamQuotation.baseCurrency.decimal,
        provider: operationStreamQuotation.provider,
        priceBuy: operationStreamQuotation.priceBuy,
        priceSell: operationStreamQuotation.priceSell,
        price: operationStreamQuotation.price,
        priority: operationStreamQuotation.priority,
      };

      await observer.execute(logger, [message]);

      expect(mockSetRedisService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not create a Operation stream quotation if id is not positive', async () => {
      const operationStreamQuotation =
        await OperationStreamQuotationFactory.create<OperationStreamQuotationEntity>(
          OperationStreamQuotationEntity.name,
        );

      const message: HandleCreateOperationStreamQuotationEventRequest = {
        quoteCurrencySymbol: operationStreamQuotation.quoteCurrency.symbol,
        quoteCurrencyId: -operationStreamQuotation.quoteCurrency.id,
        quoteCurrencyDecimal: operationStreamQuotation.quoteCurrency.decimal,
        baseCurrencySymbol: operationStreamQuotation.baseCurrency.symbol,
        baseCurrencyId: -operationStreamQuotation.baseCurrency.id,
        baseCurrencyDecimal: operationStreamQuotation.baseCurrency.decimal,
        provider: operationStreamQuotation.provider,
        priceBuy: operationStreamQuotation.priceBuy,
        priceSell: operationStreamQuotation.priceSell,
        price: operationStreamQuotation.price,
        priority: operationStreamQuotation.priority,
      };

      const result = () => observer.execute(logger, [message]);

      await expect(result).rejects.toThrow(InvalidDataFormatException);
      expect(mockSetRedisService).toHaveBeenCalledTimes(0);
    });
  });

  it('TC0003 - Should not create a Operation stream quotation if priceSell is NaN', async () => {
    const operationStreamQuotation =
      await OperationStreamQuotationFactory.create<OperationStreamQuotationEntity>(
        OperationStreamQuotationEntity.name,
      );

    const message: HandleCreateOperationStreamQuotationEventRequest = {
      quoteCurrencySymbol: operationStreamQuotation.quoteCurrency.symbol,
      quoteCurrencyId: -operationStreamQuotation.quoteCurrency.id,
      quoteCurrencyDecimal: operationStreamQuotation.quoteCurrency.decimal,
      baseCurrencySymbol: operationStreamQuotation.baseCurrency.symbol,
      baseCurrencyId: -operationStreamQuotation.baseCurrency.id,
      baseCurrencyDecimal: operationStreamQuotation.baseCurrency.decimal,
      provider: operationStreamQuotation.provider,
      priceBuy: operationStreamQuotation.priceBuy,
      priceSell: NaN,
      price: operationStreamQuotation.price,
      priority: operationStreamQuotation.priority,
    };

    const result = () => observer.execute(logger, [message]);

    await expect(result).rejects.toThrow(InvalidDataFormatException);
    expect(mockSetRedisService).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
