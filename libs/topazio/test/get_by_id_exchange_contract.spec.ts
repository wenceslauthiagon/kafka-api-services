import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ExchangeContractPspException,
  GetExchangeContractByIdRequest,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeContractService,
  TopazioExchangeContractModule,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestGetExchangeContractById from './mocks/get_exchange_contract_by_id.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getExchageContractById', () => {
  let module: TestingModule;
  let contractService: TopazioExchangeContractService;
  let configService: ConfigService<TopazioGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.topazio.env'] }),
        TopazioExchangeContractModule,
      ],
    }).compile();

    contractService = module.get(TopazioExchangeContractService);
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

  it('TC0001 - Should get contract by id successfully', async () => {
    mockAxios.get.mockImplementationOnce(
      MockTestGetExchangeContractById.success,
    );

    const body: GetExchangeContractByIdRequest = {
      id: uuidV4(),
      page: 1,
      perPage: 2,
    };

    const result = await contractService
      .getExchangeContractGateway()
      .getExchangeContractById(body);

    expect(result).toBeDefined();
    result.resultSet.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.intermBankSwift).toBeDefined();
      expect(item.intermBankCity).toBeDefined();
      expect(item.intermBankName).toBeDefined();
      expect(item.intermBankAba).toBeDefined();
      expect(item.receiverBankSwift).toBeDefined();
      expect(item.receiverBankCity).toBeDefined();
      expect(item.receiverBankAba).toBeDefined();
      expect(item.receiverBankName).toBeDefined();
      expect(item.externalName).toBeDefined();
      expect(item.externalAddress).toBeDefined();
      expect(item.externalIban).toBeDefined();
      expect(item.internalSettlementDate).toBeDefined();
      expect(item.externalSettlementDate).toBeDefined();
      expect(item.nature).toBeDefined();
      expect(item.country).toBeDefined();
      expect(item.fxRate).toBeDefined();
      expect(item.internalValue).toBeDefined();
      expect(item.externalValue).toBeDefined();
      expect(item.iofValue).toBeDefined();
      expect(item.createdDate).toBeDefined();
      expect(item.status).toBeDefined();
      expect(item.clientReference).toBeDefined();
      expect(item.tradeIds).toBeDefined();
    });
    expect(result.page).toBeDefined();
    expect(result.perPage).toBeDefined();
    expect(result.totalRegisters).toBeDefined();
    expect(result.totalPages).toBeDefined();
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should get contract by id after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockTestGetExchangeContractById.offline,
    );

    const body: GetExchangeContractByIdRequest = {
      id: uuidV4(),
      page: 1,
      perPage: 2,
    };

    const testScript = () =>
      contractService
        .getExchangeContractGateway()
        .getExchangeContractById(body);

    await expect(testScript).rejects.toThrow(ExchangeContractPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
