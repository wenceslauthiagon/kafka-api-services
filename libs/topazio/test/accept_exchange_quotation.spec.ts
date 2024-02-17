import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptExchangeQuotationRequest,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';
import {
  TopazioExchangeQuotationModule,
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeQuotationService,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestAcceptExchangeQuotation from './mocks/accept_exchange_quotation.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway acceptExchageQuotation', () => {
  let module: TestingModule;
  let quotationService: TopazioExchangeQuotationService;
  let configService: ConfigService<TopazioGatewayConfig>;
  const body: AcceptExchangeQuotationRequest = {
    solicitationPspId: uuidV4(),
    quotationPspId: faker.datatype.number(99999).toString(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.topazio.env'] }),
        TopazioExchangeQuotationModule,
      ],
    }).compile();

    quotationService = module.get(TopazioExchangeQuotationService);
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

  it('TC0001 - Should put quotation successfully', async () => {
    mockAxios.put.mockImplementationOnce(
      MockTestAcceptExchangeQuotation.success,
    );

    const result = await quotationService
      .getExchangeQuotationGateway()
      .acceptExchangeQuotation(body);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('isAccepted');
    expect(mockAxios.put).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should put quotation after offline response', async () => {
    mockAxios.put.mockImplementationOnce(
      MockTestAcceptExchangeQuotation.offline,
    );

    const testScript = () =>
      quotationService
        .getExchangeQuotationGateway()
        .acceptExchangeQuotation(body);

    await expect(testScript).rejects.toThrow(
      OfflineExchangeQuotationPspException,
    );

    expect(mockAxios.put).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
