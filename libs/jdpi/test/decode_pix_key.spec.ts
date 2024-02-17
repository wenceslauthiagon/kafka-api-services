import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  PixKeyPspException,
  DecodedPixKeyPspRequest,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiDecodedPixKey from './mocks/decode_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway decodePixKey', () => {
  let module: TestingModule;
  let pixPaymentService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixPaymentService = module.get(JdpiPixService);
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
    jest.resetAllMocks();
    JdpiAuthGateway.clearTokens();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should get decodedPixKey successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiDecodedPixKey.success);

    const params: DecodedPixKeyPspRequest = {
      key: faker.datatype.string(),
      ispb: faker.datatype.string(),
      userDocument: faker.datatype.string(),
    };

    const result = await pixPaymentService
      .getPixKeyGateway()
      .decodePixKey(params);

    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.ispb).toBeDefined();
    expect(result.branch).toBeDefined();
    expect(result.accountNumber).toBeDefined();
    expect(result.accountType).toBeDefined();
    expect(result.accountOpeningDate).toBeDefined();
    expect(result.personType).toBeDefined();
    expect(result.document).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.tradeName).toBeDefined();
    expect(result.keyCreationDate).toBeDefined();
    expect(result.keyOwnershipDate).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.activeAccount).toBeTruthy();

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should send a request with a not found key.', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiDecodedPixKey.notFound);

    const params: DecodedPixKeyPspRequest = {
      key: faker.datatype.string(),
      ispb: faker.datatype.string(),
      userDocument: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixKeyGateway().decodePixKey(params);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should send PspException after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiDecodedPixKey.offline);

    const params: DecodedPixKeyPspRequest = {
      key: faker.datatype.string(),
      ispb: faker.datatype.string(),
      userDocument: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixKeyGateway().decodePixKey(params);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should send PspException after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiDecodedPixKey.unexpectedError);

    const params: DecodedPixKeyPspRequest = {
      key: faker.datatype.string(),
      ispb: faker.datatype.string(),
      userDocument: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixKeyGateway().decodePixKey(params);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
