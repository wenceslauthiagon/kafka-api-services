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
import { CryptoMarketFactory } from '@zro/test/otc/config';
import {
  B2C2_PROVIDER_NAME,
  B2C2CryptoRemittanceModule,
  B2C2CryptoRemittanceService,
} from '@zro/b2c2';
import * as MockGetOrderById from './config/mocks/get_order_by_id.mock';
import { MissingDataException } from '@zro/common';
import { CurrencyFactory } from '@zro/test/operations/config';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

enum CURRENCY {
  BTC = 'BTC',
  USD = 'USD',
}

describe('Conversion Gateway getOrderById', () => {
  let module: TestingModule;
  let conversionService: B2C2CryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.b2c2.env'] }),
        B2C2CryptoRemittanceModule,
      ],
    }).compile();

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

    market = await CryptoMarketFactory.create<CryptoMarketEntity>(
      CryptoMarketEntity.name,
      {
        name: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        baseCurrency,
        quoteCurrency,
        providerName: B2C2_PROVIDER_NAME,
        active: true,
        requireValidUntil: false,
        requireStopPrice: true,
      },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - TC0001 - Should get crypto remittance by id successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.success);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getB2C2CryptoRemittanceGateway()
      .getCryptoRemittanceById(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeDefined();
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not get crypto remittance by id after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.offline);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const testScript = () =>
      conversionService
        .getB2C2CryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not get crypto remittance by id if it is not found', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.notFound);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const testScript = () =>
      conversionService
        .getB2C2CryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should throw exception if missing params', async () => {
    const testScript = () =>
      conversionService
        .getB2C2CryptoRemittanceGateway()
        .getCryptoRemittanceById(null);

    await expect(testScript).rejects.toThrow(MissingDataException);
    expect(mockAxios.get).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should change crypto remittance status to canceled if order was rejected', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.rejectedOrder);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getB2C2CryptoRemittanceGateway()
      .getCryptoRemittanceById(body);

    expect(result.executedPrice).toBeNull();
    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(result.executedPrice).toBeDefined();
    expect(result.status).toBe(CryptoRemittanceStatus.WAITING);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
