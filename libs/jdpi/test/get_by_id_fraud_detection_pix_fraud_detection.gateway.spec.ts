import { v4 as uuidV4 } from 'uuid';
import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetByIdFraudDetection from './mocks/get_by_id_fraud_detection.mock';
import { GetByIdFraudDetectionPixFraudDetectionPspRequest } from '@zro/pix-payments/application';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getByIdFraudDetection', () => {
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

  it('TC0001 - Should create fraud detection successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetByIdFraudDetection.success);

    const body: GetByIdFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const result = await pixPaymentService
      .getPixFraudDetectionGateway()
      .getByIdFraudDetection(body);

    expect(result).toBeDefined();
    expect(result.fraudDetectionId).toBeDefined();
    expect(result.personType).toBeDefined();
    expect(result.document).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.fraudType).toBeDefined();
    expect(result.status).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not create fraud detection after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetByIdFraudDetection.offline);

    const body: GetByIdFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .getByIdFraudDetection(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not create fraud detection after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetByIdFraudDetection.unexpectedError,
    );

    const body: GetByIdFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .getByIdFraudDetection(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
