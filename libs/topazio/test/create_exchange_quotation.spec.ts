import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  OfflineExchangeQuotationPspException,
  CreateExchangeQuotationRequest,
} from '@zro/otc/application';
import { RemittanceSide } from '@zro/otc/domain';
import {
  TopazioExchangeQuotationModule,
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeQuotationService,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestCreateExchangeQuotation from './mocks/create_exchange_quotation.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createExchageQuotation', () => {
  let module: TestingModule;
  let quotationService: TopazioExchangeQuotationService;
  let configService: ConfigService<TopazioGatewayConfig>;
  const body: CreateExchangeQuotationRequest = {
    side: RemittanceSide.BUY,
    currencyTag: 'USD',
    amount: faker.datatype.number(99999),
    sendDate: new Date(),
    receiveDate: new Date(),
    zroBankPartnerId: faker.datatype.number(99999),
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

  it('TC0001 - Should send quotation successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockTestCreateExchangeQuotation.success,
    );

    const result = await quotationService
      .getExchangeQuotationGateway()
      .createExchangeQuotation(body);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('operation');
    expect(result).toHaveProperty('internalSettlementDate');
    expect(result).toHaveProperty('externalSettlementDate');
    expect(result).toHaveProperty('createdDate');
    expect(result).toHaveProperty('expiredDate');
    expect(result).toHaveProperty('timeExpired');
    expect(result).toHaveProperty('quotationId');
    expect(result).toHaveProperty('fxRate');
    expect(result).toHaveProperty('internalValue');
    expect(result).toHaveProperty('externalValue');
    expect(result).toHaveProperty('gatewayName');

    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  it('TC0002 - Should send quotation after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockTestCreateExchangeQuotation.offline,
    );

    const testScript = () =>
      quotationService
        .getExchangeQuotationGateway()
        .createExchangeQuotation(body);

    await expect(testScript).rejects.toThrow(
      OfflineExchangeQuotationPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
