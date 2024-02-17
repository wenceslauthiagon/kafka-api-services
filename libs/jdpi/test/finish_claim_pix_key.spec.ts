import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KeyType } from '@zro/pix-keys/domain';
import {
  FinishClaimPixKeyPspRequest,
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
import * as MockJdpiFinishClaimPixKey from './mocks/finish_claim_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway finishClaimPixKey', () => {
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

  it('TC0001 - Should send finishClaimPixKey successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiFinishClaimPixKey.success);

    const body: FinishClaimPixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      claimId: faker.datatype.uuid(),
      ispb: faker.random.numeric(),
    };

    const result = await pixKeyService
      .getPixKeyGateway()
      .finishClaimPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send finishClaimPixKey after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiFinishClaimPixKey.offline);

    const body: FinishClaimPixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      claimId: faker.datatype.uuid(),
      ispb: faker.random.numeric(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().finishClaimPixKey(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send finishClaimPixKey after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiFinishClaimPixKey.unexpectedError,
    );

    const body: FinishClaimPixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      claimId: faker.datatype.uuid(),
      ispb: faker.random.numeric(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().finishClaimPixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
