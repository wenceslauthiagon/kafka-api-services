import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  MercadoBitcoinSymbol,
  MercadoBitcoinSymbolEntity,
} from '@zro/mercado-bitcoin/domain';
import {
  CryptoMarket,
  CryptoMarketEntity,
  OrderSide,
  OrderType,
} from '@zro/otc/domain';
import {
  CryptoRemittanceGatewayException,
  OrderTypeNotSupportedCryptoRemittanceGatewayException,
  OrderSideNotSupportedCryptoRemittanceGatewayException,
  CreateCryptoRemittanceRequest,
  OrderAmountUnderflowCryptoRemittanceGatewayException,
  OrderAmountOverflowCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import {
  MercadoBitcoinConversionModule,
  MercadoBitcoinCryptoRemittanceService,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from '@zro/mercado-bitcoin';
import * as MockCreateOrder from './config/mocks/create_order.mock';
import * as MockGetOrderById from './config/mocks/get_order_by_id.mock';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import { MercadoBitcoinSymbolFactory } from './config/factories/market.factory';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

enum CURRENCY {
  BTC = 'BTC',
  BRL = 'BRL',
}

describe('MercadoBitcoinCreateCryptoRemittanceGateway', () => {
  let module: TestingModule;
  let conversionService: MercadoBitcoinCryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;
  let mbMarket: MercadoBitcoinSymbol;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.mercado-bitcoin.env'] }),
        MercadoBitcoinConversionModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    conversionService = module.get(MercadoBitcoinCryptoRemittanceService);

    baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      {
        symbol: CURRENCY.BTC,
      },
    );

    quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      {
        symbol: CURRENCY.BRL,
      },
    );

    market = await CryptoMarketFactory.build<CryptoMarketEntity>(
      CryptoMarketEntity.name,
      {
        name: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
        baseCurrency,
        quoteCurrency,
        providerName: MERCADO_BITCOIN_PROVIDER_NAME,
        active: true,
        requireValidUntil: false,
        requireStopPrice: true,
      },
    );

    mbMarket = await MercadoBitcoinSymbolFactory.create(
      MercadoBitcoinSymbolEntity.name,
      {},
      {
        baseCurrency,
        quoteCurrency,
      },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should create crypto remittance order with MARKET order type successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.success);
    mockAxios.get.mockImplementationOnce(MockGetOrderById.success);
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      validUntil: faker.date.recent(),
    };

    const result = await conversionService
      .getMercadoBitcoinCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should create crypto remittance order with LIMIT order type successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.success);
    mockAxios.get.mockImplementationOnce(MockGetOrderById.success);
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      type: OrderType.LIMIT,
      validUntil: new Date(Date.now() + 4 * 3600000),
      price: 110000,
      stopPrice: 105000,
      side: OrderSide.BUY,
      amount: faker.datatype.number(),
      market,
    };

    const result = await conversionService
      .getMercadoBitcoinCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not create crypto remittance order after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.offline);
    mockAxios.get.mockImplementationOnce(MockGetOrderById.success);
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      validUntil: faker.date.recent(),
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not create crypto remittance order with order side unsupported', async () => {
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      type: OrderType.MARKET,
      side: faker.datatype.uuid() as unknown as OrderSide,
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderSideNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not create crypto remittance order with order type unsupported', async () => {
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      type: faker.datatype.uuid() as unknown as OrderType,
      side: OrderSide.BUY,
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderTypeNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0006 - Should not create crypto remittance order if amount > maxSize', async () => {
    market.maxSize = 5;

    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: 100,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderAmountOverflowCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0007 - Should not create crypto remittance order if amount < minSize', async () => {
    market.minSize = 0.5;

    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: 0.1,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderAmountUnderflowCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0008 - Should not create crypto remittance order if status is canceled', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.canceled);
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: 1,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
    };

    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0009 - Should show error when cannot execute getCryptoRemittanceById', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.success);
    mockAxios.get.mockRejectedValue(MockGetOrderById.success);
    mockCacheGet.mockResolvedValue([mbMarket]);

    const body: CreateCryptoRemittanceRequest = {
      id: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
      amount: 1,
      type: OrderType.MARKET,
      side: OrderSide.BUY,
    };

    const result = await conversionService
      .getMercadoBitcoinCryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
