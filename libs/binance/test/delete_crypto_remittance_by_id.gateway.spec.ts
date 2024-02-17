import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { CryptoMarket, CryptoMarketEntity } from '@zro/otc/domain';
import { CryptoRemittanceGatewayException } from '@zro/otc/application';
import {
  BinanceCryptoRemittanceModule,
  BinanceCryptoRemittanceService,
  BINANCE_PROVIDER_NAME,
} from '@zro/binance';
import * as MockDeleteOrderById from './config/mocks/delete_order_by_id.mock';
import { CryptoMarketFactory } from '@zro/test/otc/config';
import { MissingDataException } from '@zro/common';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

const CURRENCY = {
  BTC: new CurrencyEntity({ symbol: 'BTC', decimal: 8 }),
  USD: new CurrencyEntity({ symbol: 'USD', decimal: 2 }),
};

describe('BinanceDeleteCryptoRemittanceByIdGateway', () => {
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

  it('TC0001 - Should delete crypto remittance by id successfully', async () => {
    mockAxios.delete.mockImplementationOnce(MockDeleteOrderById.success);

    const body = {
      id: faker.datatype.uuid(),
      baseCurrency: market.baseCurrency,
      quoteCurrency: market.quoteCurrency,
      market,
    };

    const result = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .deleteCryptoRemittanceById(body);

    expect(result).toBeDefined();
    expect(result.id).not.toBeNull();
    expect(mockAxios.delete).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not delete crypto remittance by id after offline response', async () => {
    mockAxios.delete.mockImplementationOnce(MockDeleteOrderById.offline);

    const body = {
      id: faker.datatype.uuid(),
      baseCurrency: market.baseCurrency,
      quoteCurrency: market.quoteCurrency,
      market,
    };

    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .deleteCryptoRemittanceById(body);

    await expect(testScript).rejects.toThrow(CryptoRemittanceGatewayException);

    expect(mockAxios.delete).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not delete crypto remittance by id if it is not found', async () => {
    mockAxios.delete.mockImplementationOnce(MockDeleteOrderById.notFound);

    const body = {
      id: faker.datatype.uuid(),
      baseCurrency: market.baseCurrency,
      quoteCurrency: market.quoteCurrency,
      market,
    };

    const testScript = await conversionService
      .getBinanceCryptoRemittanceGateway()
      .deleteCryptoRemittanceById(body);

    expect(testScript).toBeUndefined();
    expect(mockAxios.delete).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should throw exception if missing params', async () => {
    const testScript = () =>
      conversionService
        .getBinanceCryptoRemittanceGateway()
        .deleteCryptoRemittanceById(null);

    await expect(testScript).rejects.toThrow(MissingDataException);
    expect(mockAxios.delete).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
