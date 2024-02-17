import { Cache } from 'cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { BinanceMarket, BinanceMarketEntity } from '@zro/binance/domain';
import { BinanceQuotationModule, BinanceQuotationService } from '@zro/binance';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
} from '@zro/quotations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { BinanceMarketFactory } from './config/factories/market.factory';

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC' }),
  USD: new CurrencyEntity({ symbol: 'USD' }),
};

jest.mock('ws');

describe('BinanceGetStreamQuotationGateway', () => {
  let module: TestingModule;
  let service: BinanceQuotationService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let binanceMarket: BinanceMarket;
  let quotationGateway: GetStreamQuotationGateway;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.binance.env'] }),
        BinanceQuotationModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    service = module.get(BinanceQuotationService);
    quotationGateway = service.getGateway();
    quotationGateway.setQuoteCurrencies([CURRENCY.USD]);

    baseCurrency = CURRENCY.BTC;

    quoteCurrency = CURRENCY.USD;

    binanceMarket = await BinanceMarketFactory.create<BinanceMarketEntity>(
      BinanceMarketEntity.name,
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
      mockCacheGet.mockResolvedValueOnce([binanceMarket]);

      mockCacheGet.mockResolvedValueOnce({
        buy: 1386.1991,
        sell: 1414.2031,
        baseCurrencySymbol: CURRENCY.BTC.symbol,
        quoteCurrencySymbol: CURRENCY.USD.symbol,
        symbol: 'BTCBUSD',
        timestamp: new Date(),
      });

      const body: GetStreamQuotationGatewayRequest = {
        baseCurrencies: [CURRENCY.BTC],
      };

      const result = await service.getGateway().getQuotation(body);

      expect(result).not.toEqual([]);
      expect(mockCacheGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get quotation with not supported currency', async () => {
      mockCacheGet.mockResolvedValueOnce([binanceMarket]);

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
