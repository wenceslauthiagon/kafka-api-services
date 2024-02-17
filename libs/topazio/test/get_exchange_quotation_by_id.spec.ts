import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ExchangeQuotationNotFoundPspException,
  GetExchangeQuotationByPspIdRequest,
} from '@zro/otc/application';
import {
  TopazioExchangeQuotationModule,
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeQuotationService,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestGetExchangeQuotation from './mocks/get_exchange_quotation_by_id.mock';
import { ExchangeQuotationState } from '@zro/otc/domain';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('TopazioGetExchangeQuotationByIdGateway', () => {
  let module: TestingModule;
  let exchangeQuotationService: TopazioExchangeQuotationService;
  let configService: ConfigService<TopazioGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.topazio.env'] }),
        TopazioExchangeQuotationModule,
      ],
    }).compile();

    exchangeQuotationService = module.get(TopazioExchangeQuotationService);
    configService = module.get(ConfigService);

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    TopazioAuthGateway.clearTokens();
    mockAxios.post
      .mockImplementationOnce(MockTestAuthentication.oAuthCode)
      .mockImplementationOnce(MockTestAuthentication.oAuthToken);
  });

  it('TC0001 - Should throw ExchangeQuotationNotFoundPspException when quotation is not found.', async () => {
    mockAxios.get.mockImplementationOnce(MockTestGetExchangeQuotation.notFound);

    const body: GetExchangeQuotationByPspIdRequest = {
      solicitationPspId: uuidV4(),
    };

    const result = () =>
      exchangeQuotationService
        .getExchangeQuotationGateway()
        .getExchangeQuotationById(body);

    await expect(result).rejects.toThrow(ExchangeQuotationNotFoundPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should return approved quotation successfully.', async () => {
    mockAxios.get.mockImplementationOnce(
      MockTestGetExchangeQuotation.successApproved,
    );

    const body: GetExchangeQuotationByPspIdRequest = {
      solicitationPspId: uuidV4(),
    };

    const result = await exchangeQuotationService
      .getExchangeQuotationGateway()
      .getExchangeQuotationById(body);

    expect(result.id).toBeDefined();
    expect(result.status).toBe(ExchangeQuotationState.APPROVED);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should return completed quotation successfully.', async () => {
    mockAxios.get.mockImplementationOnce(
      MockTestGetExchangeQuotation.successCompleted,
    );

    const body: GetExchangeQuotationByPspIdRequest = {
      solicitationPspId: uuidV4(),
    };

    const result = await exchangeQuotationService
      .getExchangeQuotationGateway()
      .getExchangeQuotationById(body);

    expect(result.id).toBeDefined();
    expect(result.status).toBe(ExchangeQuotationState.COMPLETED);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
