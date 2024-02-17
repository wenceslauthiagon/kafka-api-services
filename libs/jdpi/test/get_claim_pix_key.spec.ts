import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  GetClaimPixKeyPspRequest,
  OfflinePixKeyPspException,
  PixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetClaimPixKey from './mocks/get_claim_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getClaimPixKey', () => {
  let module: TestingModule;
  let pixKeyService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixKeyService = module.get(JdpiPixService);
    configService = module.get(ConfigService);

    const authConfig: JdpiAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_JDPI_BASE_URL'),
      clientId: configService.get<string>('APP_JDPI_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_JDPI_AUTH_CLIENT_SECRET'),
    };
    JdpiAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    JdpiAuthGateway.clearTokens();
    mockAxios.post.mockReset();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should send getClaimPixKey successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiGetClaimPixKey.success);

    const body: GetClaimPixKeyPspRequest = {
      ispb: faker.random.word(),
      personType: PersonType.NATURAL_PERSON,
      document: faker.random.numeric(),
      branch: faker.random.numeric(),
      accountType: AccountType.CACC,
      accountNumber: faker.random.numeric(),
      limit: Number(faker.random.numeric()),
    };

    const result = await pixKeyService.getPixKeyGateway().getClaimPixKey(body);

    expect(result).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send getClaimPixKey after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiGetClaimPixKey.offline);

    const body: GetClaimPixKeyPspRequest = {
      ispb: faker.random.word(),
      personType: PersonType.NATURAL_PERSON,
      document: faker.random.numeric(),
      branch: faker.random.numeric(),
      accountType: AccountType.CACC,
      accountNumber: faker.random.numeric(),
      limit: Number(faker.random.numeric()),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().getClaimPixKey(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send getClaimPixKey after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiGetClaimPixKey.unexpectedError,
    );

    const body: GetClaimPixKeyPspRequest = {
      ispb: faker.random.word(),
      personType: PersonType.NATURAL_PERSON,
      document: faker.random.numeric(),
      branch: faker.random.numeric(),
      accountType: AccountType.CACC,
      accountNumber: faker.random.numeric(),
      limit: Number(faker.random.numeric()),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().getClaimPixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
