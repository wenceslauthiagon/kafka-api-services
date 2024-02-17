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
  CancelFraudDetectionPixFraudDetectionPspRequest,
} from '@zro/pix-payments/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCancelFraudDetection from './mocks/cancel_fraud_detection.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway cancelFraudDetection', () => {
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

  it('TC0001 - Should cancel fraud detection successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCancelFraudDetection.success);

    const body: CancelFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const result = await pixPaymentService
      .getPixFraudDetectionGateway()
      .cancelFraudDetection(body);

    expect(result).toBeDefined();
    expect(result.fraudDetectionId).toBeDefined();
    expect(result.status).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should not cancel fraud detection after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCancelFraudDetection.offline);

    const body: CancelFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .cancelFraudDetection(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should not cancel fraud detection after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCancelFraudDetection.unexpectedError,
    );

    const body: CancelFraudDetectionPixFraudDetectionPspRequest = {
      fraudDetectionId: uuidV4(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .cancelFraudDetection(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
