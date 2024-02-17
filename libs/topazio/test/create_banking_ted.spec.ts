import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountType } from '@zro/pix-payments/domain';
import {
  OfflineBankingTedPspException,
  CreateBankingTedPspRequest,
} from '@zro/banking/application';
import {
  TopazioBankingModule,
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
  TopazioBankingService,
} from '@zro/topazio';
import * as MockTestAuthentication from './mocks/auth.mock';
import * as MockTestCreateBankingTed from './mocks/create_banking_ted.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createBankingTed', () => {
  let module: TestingModule;
  let bankingTedService: TopazioBankingService;
  let configService: ConfigService<TopazioGatewayConfig>;

  const body: CreateBankingTedPspRequest = {
    transactionId: faker.datatype.uuid(),
    ownerDocument: faker.datatype.number(99999).toString().padStart(8, '0'),
    ownerName: faker.name.firstName(),
    ownerAccount: faker.datatype.number(99999).toString().padStart(8, '0'),
    beneficiaryDocument: faker.datatype
      .number(99999)
      .toString()
      .padStart(8, '0'),
    beneficiaryName: faker.name.firstName(),
    beneficiaryBankCode: faker.datatype.number(999).toString().padStart(3, '0'),
    beneficiaryAgency: faker.datatype.number(9999).toString().padStart(4, '0'),
    beneficiaryAccount: faker.datatype
      .number(99999)
      .toString()
      .padStart(8, '0'),
    beneficiaryAccountDigit: faker.datatype
      .number(99)
      .toString()
      .padStart(2, '0'),
    beneficiaryAccountType: AccountType.CACC,
    amount: faker.datatype.number({ min: 1, max: 99999 }),
    purposeCode: faker.datatype.number(9999),
    description: faker.datatype.number(99999).toString(),
    callbackUrl: faker.datatype.number(99999).toString(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.topazio.env'] }),
        TopazioBankingModule,
      ],
    }).compile();

    bankingTedService = module.get(TopazioBankingService);
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

  it('TC0001 - Should send createBankingTed successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockTestCreateBankingTed.success);

    const result = await bankingTedService
      .getBankingTedGateway()
      .createBankingTed(body);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('transactionId');
    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  it('TC0002 - Should send createBankingTed after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockTestCreateBankingTed.offline);

    const testScript = () =>
      bankingTedService.getBankingTedGateway().createBankingTed(body);

    await expect(testScript).rejects.toThrow(OfflineBankingTedPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(3);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
