import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { ConfigModule } from '@nestjs/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { B2C2Market, B2C2MarketEntity } from '@zro/b2c2/domain';
import { B2C2QuotationModule, B2C2QuotationService } from '@zro/b2c2';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
} from '@zro/quotations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { B2C2MarketFactory } from './config/factories/market.factory';

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC' }),
  USD: new CurrencyEntity({ symbol: 'USD' }),
};

jest.mock('ws');

describe('B2C2GetStreamQuotationGateway', () => {
  let module: TestingModule;
  let service: B2C2QuotationService;
  let b2c2Market: B2C2Market;
  let quotationGateway: GetStreamQuotationGateway;

  const baseCurrency = CURRENCY.BTC;
  const quoteCurrency = CURRENCY.USD;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.b2c2.env'] }),
        B2C2QuotationModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    service = module.get(B2C2QuotationService);
    quotationGateway = service.getGateway();
    quotationGateway.setQuoteCurrencies([quoteCurrency]);

    b2c2Market = await B2C2MarketFactory.create<B2C2MarketEntity>(
      B2C2MarketEntity.name,
      {},
      { baseCurrency, quoteCurrency },
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
    quotationGateway.start();
  });

  afterEach(() => {
    quotationGateway.stop();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get quotation successfully', async () => {
      mockCacheGet.mockResolvedValueOnce([b2c2Market]);

      mockCacheGet.mockResolvedValueOnce({
        buy: '1386.1991',
        instrument: 'BTCUSD',
        sell: '1414.2031',
        timestamp: new Date(),
        baseCurrency: baseCurrency.symbol,
        quoteCurrency: quoteCurrency.symbol,
      });

      const body: GetStreamQuotationGatewayRequest = {
        baseCurrencies: [baseCurrency],
      };

      const result = await service.getGateway().getQuotation(body);

      expect(result).not.toEqual([]);
      expect(mockCacheGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get quotation with not supported currency', async () => {
      mockCacheGet.mockResolvedValueOnce([b2c2Market]);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const body: GetStreamQuotationGatewayRequest = {
        baseCurrencies: [currency],
      };

      const result = await service.getGateway().getQuotation(body);

      expect(result).toEqual([]);
      expect(mockCacheGet).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
