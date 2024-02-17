import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CreateExchangeContractRequest,
  OfflineExchangeContractPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioExchangeContractService,
  TopazioExchangeContractModule,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestCreateExchangeContract from './mocks/create_exchange_contract.mock';

const mockAxios: any = axios;
jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createExchageContract', () => {
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
    mockAxios.post.mockImplementationOnce(
      MockTestCreateExchangeContract.success,
    );

    const body: CreateExchangeContractRequest = {
      tradeIds: [faker.datatype.uuid(), faker.datatype.uuid()],
      externalName: faker.company.name(),
      externalIban: faker.finance.iban(),
      externalAddress: faker.address.streetAddress(),
      intermBankSwift: faker.finance.bic(),
      intermBankCity: faker.address.city(),
      intermBankName: faker.company.name(),
      intermBankAba: faker.finance.routingNumber(),
      receiverBankSwift: faker.finance.bic(),
      receiverBankCity: faker.address.city(),
      receiverBankAba: faker.finance.routingNumber(),
      receiverBankName: faker.company.name(),
      nature: faker.datatype.number(),
      country: faker.datatype.number(),
      averageBankFxRate: faker.datatype.number(),
      averageFxRate: faker.datatype.number(),
      averageSpot: faker.datatype.number(),
      clientReference: faker.random.alphaNumeric(),
    };

    const result = await contractService
      .getExchangeContractGateway()
      .createExchangeContract(body);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.intermBankSwift).toBeDefined();
    expect(result.receiverBankSwift).toBeDefined();
    expect(result.externalName).toBeDefined();
    expect(result.externalAddress).toBeDefined();
    expect(result.externalIban).toBeDefined();
    expect(result.internalDocument).toBeDefined();
    expect(result.internalSettlementDate).toBeDefined();
    expect(result.externalSettlementDate).toBeDefined();
    expect(result.nature).toBeDefined();
    expect(result.fxRate).toBeDefined();
    expect(result.country).toBeDefined();
    expect(result.createdDate).toBeDefined();
    expect(result.externalValue).toBeDefined();
    expect(result.internalValue).toBeDefined();
    expect(result.iofValue).toBeDefined();
    expect(result.receiverBankCity).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.tradeIds).toBeDefined();

    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  it('TC0002 - Should get contract after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockTestCreateExchangeContract.offline,
    );

    const body: CreateExchangeContractRequest = {
      tradeIds: [faker.datatype.uuid(), faker.datatype.uuid()],
      externalName: faker.company.name(),
      externalIban: faker.finance.iban(),
      externalAddress: faker.address.streetAddress(),
      intermBankSwift: faker.finance.bic(),
      intermBankCity: faker.address.city(),
      intermBankName: faker.company.name(),
      intermBankAba: faker.finance.routingNumber(),
      receiverBankSwift: faker.finance.bic(),
      receiverBankCity: faker.address.city(),
      receiverBankAba: faker.finance.routingNumber(),
      receiverBankName: faker.company.name(),
      nature: faker.datatype.number(),
      country: faker.datatype.number(),
      averageBankFxRate: faker.datatype.number(),
      averageFxRate: faker.datatype.number(),
      averageSpot: faker.datatype.number(),
      clientReference: faker.random.alphaNumeric(),
    };

    const testScript = () =>
      contractService.getExchangeContractGateway().createExchangeContract(body);

    await expect(testScript).rejects.toThrow(
      OfflineExchangeContractPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
