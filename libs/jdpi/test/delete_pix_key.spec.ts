import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PixKeyReasonType, KeyType } from '@zro/pix-keys/domain';
import {
  DeletePixKeyPspRequest,
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
import * as MockJdpiDeletePixKey from './mocks/delete_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway deletePixKey', () => {
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

  it('TC0001 - Should send deletePixKey successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeletePixKey.success);

    const body: DeletePixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      reason: PixKeyReasonType.USER_REQUESTED,
      ispb: faker.random.numeric(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().deletePixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send deletePixKey after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeletePixKey.offline);

    const body: DeletePixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      reason: PixKeyReasonType.USER_REQUESTED,
      ispb: faker.random.numeric(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().deletePixKey(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send deletePixKey after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDeletePixKey.unexpectedError);

    const body: DeletePixKeyPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      reason: PixKeyReasonType.USER_REQUESTED,
      ispb: faker.random.numeric(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().deletePixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
