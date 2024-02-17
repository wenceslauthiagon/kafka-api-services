import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  CryptoMarket,
  CryptoMarketEntity,
  CryptoRemittanceStatus,
  OrderSide,
  OrderType,
} from '@zro/otc/domain';
import {
  CreateCryptoRemittanceRequest,
  CryptoRemittanceGatewayException,
  OrderSideNotSupportedCryptoRemittanceGatewayException,
  OrderTypeNotSupportedCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import {
  BinanceCryptoRemittanceModule,
  BinanceCryptoRemittanceService,
  BINANCE_PROVIDER_NAME,
} from '@zro/binance';
import * as MockCreateOrder from './config/mocks/create_order.mock';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import { BinanceMarket, BinanceMarketEntity } from '@zro/binance/domain';
import { BinanceMarketFactory } from './config/factories/market.factory';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC', decimal: 8 }),
  USD: new CurrencyEntity({ symbol: 'USD', decimal: 2 }),
};

describe('BinanceCreateCryptoRemittanceGateway', () => {
  let module: TestingModule;
  let conversionService: BinanceCryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;
  let binanceMarket: BinanceMarket;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.binance.env'] }),
        BinanceCryptoRemittanceModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    conversionService = module.get(BinanceCryptoRemittanceService);

    baseCurrency = CURRENCY.BTC;

    quoteCurrency = CURRENCY.USD;

    market = await CryptoMarketFactory.build<CryptoMarketEntity>(
      CryptoMarketEntity.name,
      {
        name: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
        baseCurrency,
        quoteCurrency,
        providerName: BINANCE_PROVIDER_NAME,
        active: true,
        requireValidUntil: false,
        requireStopPrice: false,
        priceSignificantDigits: 8,
      },
    );

    binanceMarket = await BinanceMarketFactory.create(
      BinanceMarketEntity.name,
      {},
      {
        baseCurrency,
        quoteCurrency,
      },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should create crypto remittance order with MARKET order type successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.successMarket);
    mockCacheGet.mockResolvedValue([binanceMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number(),
      type: OrderType.MARKET,
      side: OrderSide.BUY,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should create crypto remittance order with LIMIT order type successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.successLimit);
    mockCacheGet.mockResolvedValue([binanceMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number(),
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      price: faker.datatype.number(),
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not create crypto remittance order after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.offline);
    mockCacheGet.mockResolvedValue([binanceMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number(),
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      validUntil: faker.date.recent(),
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not create crypto remittance order with unsupported order side', async () => {
    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number(),
      type: OrderType.MARKET,
      side: faker.datatype.uuid() as unknown as OrderSide,
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderSideNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
    expect(mockCacheGet).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not create crypto remittance order with unsupported order type', async () => {
    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number(),
      type: faker.datatype.uuid() as unknown as OrderType,
      side: OrderSide.BUY,
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderTypeNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
    expect(mockCacheGet).toHaveBeenCalledTimes(0);
  });

  it('TC0006 - Should change crypto remittance status to error if order was not placed', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.notFilledOrder);
    mockCacheGet.mockResolvedValue([binanceMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      price: faker.datatype.number({ min: 100000, max: 999999 }),
      amount: faker.datatype.number({ min: 100000, max: 999999 }),
      type: OrderType.LIMIT,
      side: OrderSide.SELL,
      validUntil: null,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedQuantity).toEqual(0);
    expect(result.executedPrice).toEqual(0);
    expect(result.status).toBe(CryptoRemittanceStatus.CANCELED);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
