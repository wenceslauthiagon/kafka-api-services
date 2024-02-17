import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GetStreamQuotationGateway } from '@zro/quotations/application';
import {
  ApiLayerQuotationModule,
  APILAYER_SERVICES,
  ApiLayerGetStreamQuotationService,
} from '@zro/apilayer/infrastructure';
import {
  apilayerQuotationMockOfflineFail,
  apilayerQuotationMockSuccess,
} from '@zro/test/apilayer/config';
import { CurrencyEntity } from '@zro/operations/domain';

jest.mock('axios');

const mockGet: any = axios.get;
const mockCreate: any = axios.create;
mockCreate.mockImplementation(() => axios);

describe('Test get APILAYER quotation', () => {
  let module: TestingModule;
  let quotationGateway: GetStreamQuotationGateway;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.apilayer.env'] }),
        ApiLayerQuotationModule,
      ],
    }).compile();

    const service = module.get(ApiLayerGetStreamQuotationService);
    quotationGateway = service.getGateway();
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should get quotation successfully', async () => {
    mockGet.mockImplementationOnce(apilayerQuotationMockSuccess('USD', 'BRL'));

    quotationGateway.setQuoteCurrencies([
      new CurrencyEntity({ symbol: 'BRL' }),
    ]);

    await quotationGateway.getQuotation({
      baseCurrencies: [new CurrencyEntity({ symbol: 'USD' })],
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(APILAYER_SERVICES.LIVE);
    expect(mockGet.mock.calls[0][1].params.source).toBe('BRL');
    expect(mockGet.mock.calls[0][1].params.currencies).toBe('USD');
  });

  it('TC0002 - Should not get quotation wher server is offline', async () => {
    mockGet.mockImplementationOnce(apilayerQuotationMockOfflineFail);

    quotationGateway.setQuoteCurrencies([
      new CurrencyEntity({ symbol: 'BRL' }),
    ]);

    const result = await quotationGateway.getQuotation({
      baseCurrencies: [new CurrencyEntity({ symbol: 'USD' })],
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(0);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(APILAYER_SERVICES.LIVE);
    expect(mockGet.mock.calls[0][1].params.source).toBe('BRL');
    expect(mockGet.mock.calls[0][1].params.currencies).toBe('USD');
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
