import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Cache } from 'cache-manager';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { B2C2Market, B2C2MarketEntity } from '@zro/b2c2/domain';
import {
  CryptoMarket,
  CryptoMarketEntity,
  OrderSide,
  OrderType,
  CryptoRemittanceStatus,
} from '@zro/otc/domain';
import {
  OrderTypeNotSupportedCryptoRemittanceGatewayException,
  OrderSideNotSupportedCryptoRemittanceGatewayException,
  CreateCryptoRemittanceRequest,
  OfflineCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import {
  B2C2CryptoRemittanceModule,
  B2C2CryptoRemittanceService,
  B2C2_PROVIDER_NAME,
} from '@zro/b2c2';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import * as MockCreateOrder from './config/mocks/create_order.mock';
import { B2C2MarketFactory } from './config/factories/market.factory';
import { CurrencyFactory } from '@zro/test/operations/config';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

enum CURRENCY {
  BTC = 'BTC',
  USD = 'USD',
}

describe('B2C2CreateCryptoRemittanceGateway', () => {
  let module: TestingModule;
  let conversionService: B2C2CryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;
  let b2c2Market: B2C2Market;

  const cache: Cache = createMock<Cache>();
  const mockCacheGet: jest.Mock = On(cache).get(method((mock) => mock.get));

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.b2c2.env'] }),
        B2C2CryptoRemittanceModule,
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(cache)
      .compile();

    conversionService = module.get(B2C2CryptoRemittanceService);

    baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      {
        symbol: CURRENCY.BTC,
      },
    );

    quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      {
        symbol: CURRENCY.USD,
      },
    );

    market = await CryptoMarketFactory.build<CryptoMarketEntity>(
      CryptoMarketEntity.name,
      {
        name: `${baseCurrency.symbol}${quoteCurrency.symbol}`,
        baseCurrency,
        quoteCurrency,
        providerName: B2C2_PROVIDER_NAME,
        active: true,
        requireValidUntil: false,
        requireStopPrice: true,
      },
    );

    b2c2Market = await B2C2MarketFactory.create<B2C2MarketEntity>(
      B2C2MarketEntity.name,
      {},
      { baseCurrency, quoteCurrency },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should create crypto remittance order with MARKET order type successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.success);
    mockCacheGet.mockResolvedValue([b2c2Market]);

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
      .getB2C2CryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(result.executedPrice).not.toBeNull();
    expect(result.status).toBe(CryptoRemittanceStatus.FILLED);
  });

  it('TC0002 - Should not create crypto remittance order after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.offline);
    mockCacheGet.mockResolvedValue([b2c2Market]);

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
        .getB2C2CryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OfflineCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not create crypto remittance order with unsupported order side', async () => {
    mockCacheGet.mockResolvedValue([b2c2Market]);

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
        .getB2C2CryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderSideNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should not create crypto remittance order with unsupported order type', async () => {
    mockCacheGet.mockResolvedValue([b2c2Market]);

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
        .getB2C2CryptoRemittanceGateway()
        .createCryptoRemittance(body);

    await expect(testScript).rejects.toThrow(
      OrderTypeNotSupportedCryptoRemittanceGatewayException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should change crypto remittance status to error if order failed', async () => {
    mockAxios.post.mockImplementationOnce(MockCreateOrder.rejectedOrder);
    mockCacheGet.mockResolvedValue([b2c2Market]);

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

    const result = await conversionService
      .getB2C2CryptoRemittanceGateway()
      .createCryptoRemittance(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeNull();
    expect(result.status).toBe(CryptoRemittanceStatus.ERROR);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
