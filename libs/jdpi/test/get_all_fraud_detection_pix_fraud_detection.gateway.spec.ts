import { cpf } from 'cpf-cnpj-validator';
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
  GetAllFraudDetectionPixFraudDetectionPspRequest,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionType,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetAllFraudDetection from './mocks/get_all_fraud_detection.mock';
import { getMoment } from '@zro/common';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getAllFraudDetection', () => {
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
    mockAxios.get.mockImplementationOnce(MockJdpiGetAllFraudDetection.success);

    const document = cpf.generate();
    const body: GetAllFraudDetectionPixFraudDetectionPspRequest = {
      document,
      key: document,
      fraudDetectionId: uuidV4(),
      fraudType: PixFraudDetectionType.FALSE_IDENTIFICATION,
      status: PixFraudDetectionStatus.REGISTERED,
      createdAtStart: getMoment().subtract(1, 'day').toDate(),
      createdAtEnd: getMoment().toDate(),
      page: 1,
      size: 100,
    };

    const result = await pixPaymentService
      .getPixFraudDetectionGateway()
      .getAllFraudDetection(body);

    expect(result).toBeDefined();
    expect(result.fraudDetections).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not create fraud detection after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetAllFraudDetection.offline);

    const document = cpf.generate();
    const body: GetAllFraudDetectionPixFraudDetectionPspRequest = {
      document,
      key: document,
      fraudDetectionId: uuidV4(),
      fraudType: PixFraudDetectionType.FALSE_IDENTIFICATION,
      status: PixFraudDetectionStatus.REGISTERED,
      createdAtStart: getMoment().subtract(1, 'day').toDate(),
      createdAtEnd: getMoment().toDate(),
      page: 1,
      size: 100,
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .getAllFraudDetection(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not create fraud detection after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetAllFraudDetection.unexpectedError,
    );

    const document = cpf.generate();
    const body: GetAllFraudDetectionPixFraudDetectionPspRequest = {
      document,
      key: document,
      fraudDetectionId: uuidV4(),
      fraudType: PixFraudDetectionType.FALSE_IDENTIFICATION,
      status: PixFraudDetectionStatus.REGISTERED,
      createdAtStart: getMoment().subtract(1, 'day').toDate(),
      createdAtEnd: getMoment().toDate(),
      page: 1,
      size: 100,
    };

    const testScript = () =>
      pixPaymentService
        .getPixFraudDetectionGateway()
        .getAllFraudDetection(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
