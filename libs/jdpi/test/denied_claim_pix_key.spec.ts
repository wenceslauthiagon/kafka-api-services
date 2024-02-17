import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClaimReasonType, KeyType } from '@zro/pix-keys/domain';
import {
  DeniedClaimPspRequest,
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
import * as MockJdpiDeniedClaim from './mocks/denied_claim_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway deniedClaim', () => {
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

  it('TC0001 - Should send deniedClaim successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeniedClaim.success);

    const body: DeniedClaimPspRequest = {
      key: uuidV4(),
      keyType: KeyType.EVP,
      document: uuidV4(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: uuidV4(),
      ispb: uuidV4(),
      isClaimOwner: false,
    };

    const result = await pixKeyService.getPixKeyGateway().deniedClaim(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send deniedClaim after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeniedClaim.offline);

    const body: DeniedClaimPspRequest = {
      key: uuidV4(),
      keyType: KeyType.EVP,
      document: uuidV4(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: uuidV4(),
      ispb: uuidV4(),
      isClaimOwner: false,
    };

    const testScript = () => pixKeyService.getPixKeyGateway().deniedClaim(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send deniedClaim after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeniedClaim.unexpectedError);

    const body: DeniedClaimPspRequest = {
      key: uuidV4(),
      keyType: KeyType.EVP,
      document: uuidV4(),
      reason: ClaimReasonType.USER_REQUESTED,
      claimId: uuidV4(),
      ispb: uuidV4(),
      isClaimOwner: false,
    };

    const testScript = () => pixKeyService.getPixKeyGateway().deniedClaim(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
