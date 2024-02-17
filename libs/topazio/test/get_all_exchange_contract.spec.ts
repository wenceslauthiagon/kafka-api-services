import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ExchangeContractPspException,
  GetAllExchangeContractRequest,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeContractService,
  TopazioExchangeContractModule,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestGetAllExchangeContract from './mocks/get_all_exchange_contract.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getAllExchageContract', () => {
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

  it('TC0001 - Should send contract successfully', async () => {
    mockAxios.get.mockImplementationOnce(
      MockTestGetAllExchangeContract.success,
    );

    const body: GetAllExchangeContractRequest = {
      id: uuidV4(),
      page: 1,
      perPage: 2,
    };

    const result = await contractService
      .getExchangeContractGateway()
      .getAllExchangeContract(body);

    expect(result).toBeDefined();
    result.resultSet.forEach((refund) => {
      expect(refund.id).toBeDefined();
      expect(refund.intermBankSwift).toBeDefined();
      expect(refund.intermBankCity).toBeDefined();
      expect(refund.intermBankName).toBeDefined();
      expect(refund.intermBankAba).toBeDefined();
      expect(refund.receiverBankSwift).toBeDefined();
      expect(refund.receiverBankCity).toBeDefined();
      expect(refund.receiverBankAba).toBeDefined();
      expect(refund.receiverBankName).toBeDefined();
      expect(refund.externalName).toBeDefined();
      expect(refund.externalAddress).toBeDefined();
      expect(refund.externalIban).toBeDefined();
      expect(refund.internalSettlementDate).toBeDefined();
      expect(refund.externalSettlementDate).toBeDefined();
      expect(refund.nature).toBeDefined();
      expect(refund.country).toBeDefined();
      expect(refund.fxRate).toBeDefined();
      expect(refund.internalValue).toBeDefined();
      expect(refund.externalValue).toBeDefined();
      expect(refund.iofValue).toBeDefined();
      expect(refund.createdDate).toBeDefined();
      expect(refund.status).toBeDefined();
      expect(refund.clientReference).toBeDefined();
      expect(refund.tradeIds).toBeDefined();
    });
    expect(result.page).toBeDefined();
    expect(result.perPage).toBeDefined();
    expect(result.totalRegisters).toBeDefined();
    expect(result.totalPages).toBeDefined();

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should get contract after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockTestGetAllExchangeContract.offline,
    );

    const body: GetAllExchangeContractRequest = {
      id: uuidV4(),
      page: 1,
      perPage: 2,
    };

    const testScript = () =>
      contractService.getExchangeContractGateway().getAllExchangeContract(body);

    await expect(testScript).rejects.toThrow(ExchangeContractPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
