import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClaimReasonType, KeyType } from '@zro/pix-keys/domain';
import {
  ConfirmPortabilityClaimPspRequest,
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
import * as MockJdpiConfirmClaim from './mocks/confirm_portability_claim_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway confirmPortabilityClaim', () => {
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

  it('TC0001 - Should send confirmPortabilityClaim successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiConfirmClaim.success);

    const body: ConfirmPortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      document: faker.datatype.string(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: faker.datatype.uuid(),
      ispb: faker.datatype.string(),
    };

    const result = await pixKeyService
      .getPixKeyGateway()
      .confirmPortabilityClaim(body);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.keyType).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send confirmPortabilityClaim after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiConfirmClaim.offline);

    const body: ConfirmPortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      document: faker.datatype.string(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: faker.datatype.uuid(),
      ispb: faker.datatype.string(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().confirmPortabilityClaim(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send confirmPortabilityClaim after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiConfirmClaim.unexpectedError);

    const body: ConfirmPortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      document: faker.datatype.string(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: faker.datatype.uuid(),
      ispb: faker.datatype.string(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().confirmPortabilityClaim(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
