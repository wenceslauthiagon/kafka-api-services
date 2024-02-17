import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeyType } from '@zro/pix-keys/domain';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CreateQrCodeStaticPixPaymentPspRequest,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreateQrCodeStatic from './mocks/create_qr_code_static_pix_payment.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createQrCodeStatic', () => {
  let module: TestingModule;
  let pixService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixService = module.get(JdpiPixService);
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

  it('TC0001 - Should send createQrCodeStatic successfully', async () => {
    const body: CreateQrCodeStaticPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      qrCodeStaticId: faker.datatype.uuid(),
      recipientName: faker.name.fullName(),
      recipientCity: faker.address.cityName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      txId: faker.name.firstName(),
    };

    mockAxios.post.mockImplementationOnce(MockJdpiCreateQrCodeStatic.success);

    const result = await pixService
      .getPixPaymentGateway()
      .createQrCodeStatic(body);

    expect(result).toBeDefined();
    expect(result.emv).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createQrCodeStatic after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreateQrCodeStatic.offline);

    const body: CreateQrCodeStaticPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      qrCodeStaticId: faker.datatype.uuid(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      txId: faker.name.firstName(),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createQrCodeStatic(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createQrCodeStatic after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreateQrCodeStatic.unexpectedError,
    );

    const body: CreateQrCodeStaticPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      qrCodeStaticId: faker.datatype.uuid(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      txId: faker.name.firstName(),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createQrCodeStatic(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
