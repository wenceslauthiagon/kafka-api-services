import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  CryptoMarket,
  CryptoMarketEntity,
  CryptoRemittanceStatus,
} from '@zro/otc/domain';
import { CryptoRemittanceGatewayException } from '@zro/otc/application';
import {
  BinanceCryptoRemittanceModule,
  BinanceCryptoRemittanceService,
  BINANCE_PROVIDER_NAME,
} from '@zro/binance';
import * as MockGetOrderById from './config/mocks/get_order_by_id.mock';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import { MissingDataException } from '@zro/common';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC', decimal: 8 }),
  USD: new CurrencyEntity({ symbol: 'USD', decimal: 2 }),
};

describe('BinanceGetCryptoRemittanceByIdGateway', () => {
  let module: TestingModule;
  let conversionService: BinanceCryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.binance.env'] }),
        BinanceCryptoRemittanceModule,
      ],
    }).compile();

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
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should get crypto remittance by id with MARKET order type successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.successMarket);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .getCryptoRemittanceById(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeDefined();
    expect(result.executedQuantity).toBeDefined();
    expect(result.status).toBe(CryptoRemittanceStatus.FILLED);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should get crypto remittance by id with LIMIT order type successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.successLimit);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .getCryptoRemittanceById(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeDefined();
    expect(result.executedQuantity).toBeDefined();
    expect(result.status).toBe(CryptoRemittanceStatus.FILLED);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not get crypto remittance by id after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.offline);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not get crypto remittance by id if it is not found', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.notFound);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0005 - Should throw exception if missing params', async () => {
    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .getCryptoRemittanceById(null);

    await expect(testScript).rejects.toThrow(MissingDataException);
    expect(mockAxios.get).toHaveBeenCalledTimes(0);
  });

  it('TC0006 - Should change crypto remittance status if order was not filled', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.notFilledOrder);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .getCryptoRemittanceById(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeDefined();
    expect(result.status).toBe(CryptoRemittanceStatus.CANCELED);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
