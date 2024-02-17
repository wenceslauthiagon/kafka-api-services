import { Cache } from 'cache-manager';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { ConfigModule } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MercadoBitcoinSymbol,
  MercadoBitcoinSymbolEntity,
} from '@zro/mercado-bitcoin/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  MercadoBitcoinQuotationModule,
  MercadoBitcoinGetStreamQuotationService,
} from '@zro/mercado-bitcoin';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
} from '@zro/quotations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { MercadoBitcoinSymbolFactory } from './config/factories/market.factory';

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC' }),
  BRL: new CurrencyEntity({ symbol: 'BRL' }),
};

jest.mock('ws');

describe('MercadoBitcoinGetStreamQuotationGateway', () => {
  let module: TestingModule;
  let service: MercadoBitcoinGetStreamQuotationService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let mercadoBitcoinMarket: MercadoBitcoinSymbol;
  let quotationGateway: GetStreamQuotationGateway;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.mercado-bitcoin.env'] }),
        MercadoBitcoinQuotationModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    service = module.get(MercadoBitcoinGetStreamQuotationService);
    quotationGateway = service.getGateway();
    quotationGateway.setQuoteCurrencies([CURRENCY.BRL]);

    baseCurrency = CURRENCY.BTC;

    quoteCurrency = CURRENCY.BRL;

    mercadoBitcoinMarket = await MercadoBitcoinSymbolFactory.create(
      MercadoBitcoinSymbolEntity.name,
      {},
      {
        baseCurrency,
        quoteCurrency,
      },
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
      mockCacheGet.mockResolvedValueOnce([mercadoBitcoinMarket]);

      mockCacheGet.mockResolvedValueOnce({
        buy: 1386.1991,
        sell: 1414.2031,
        baseCurrency: baseCurrency.symbol,
        quoteCurrency: quoteCurrency.symbol,
        marketName: 'BTCBUSD',
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
      mockCacheGet.mockResolvedValueOnce([mercadoBitcoinMarket]);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const body: GetStreamQuotationGatewayRequest = {
        baseCurrencies: [currency],
      };

      const result = await service.getGateway().getQuotation(body);

      expect(result).toBeDefined();
      expect(mockCacheGet).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
