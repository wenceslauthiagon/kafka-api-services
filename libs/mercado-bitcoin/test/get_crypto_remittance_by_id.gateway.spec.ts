import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { CryptoMarket, CryptoMarketEntity } from '@zro/otc/domain';
import { CryptoRemittanceGatewayException } from '@zro/otc/application';
import {
  MercadoBitcoinConversionModule,
  MercadoBitcoinCryptoRemittanceService,
  MERCADO_BITCOIN_PROVIDER_NAME,
} from '@zro/mercado-bitcoin';
import * as MockGetOrderById from './config/mocks/get_order_by_id.mock';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import { MissingDataException } from '@zro/common';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

const CURRENCY = {
  BTC: 'BTC',
  BRL: 'BRL',
};

describe('MercadoBitcoinGetCryptoRemittanceByIdGateway', () => {
  let module: TestingModule;
  let conversionService: MercadoBitcoinCryptoRemittanceService;
  let baseCurrency: Currency;
  let quoteCurrency: Currency;
  let market: CryptoMarket;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.mercado-bitcoin.env'] }),
        MercadoBitcoinConversionModule,
      ],
    }).compile();

    conversionService = module.get(MercadoBitcoinCryptoRemittanceService);

    baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      { symbol: CURRENCY.BTC },
    );
    quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
      CurrencyEntity.name,
      { symbol: CURRENCY.BRL },
    );

    market = await CryptoMarketFactory.create<CryptoMarketEntity>(
      CryptoMarketEntity.name,
      {
        name: `${baseCurrency.symbol}-${quoteCurrency.symbol}`,
        baseCurrency,
        quoteCurrency,
        providerName: MERCADO_BITCOIN_PROVIDER_NAME,
        active: true,
        requireValidUntil: false,
        requireStopPrice: true,
      },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should get crypto remittance by id successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockGetOrderById.success);

    const body = {
      providerOrderId: faker.datatype.uuid(),
      baseCurrency,
      quoteCurrency,
      market,
    };

    const result = await conversionService
      .getMercadoBitcoinCryptoRemittanceGateway()
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
        .getMercadoBitcoinCryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should throw exception if missing params', async () => {
    const testScript = () =>
      conversionService
        .getMercadoBitcoinCryptoRemittanceGateway()
        .getCryptoRemittanceById(null);

    await expect(testScript).rejects.toThrow(MissingDataException);
    expect(mockAxios.get).toHaveBeenCalledTimes(0);
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
        .getMercadoBitcoinCryptoRemittanceGateway()
        .getCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
