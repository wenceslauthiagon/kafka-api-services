import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  GetPaymentPixPaymentPspRequest,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
  JdpiLaunchSituationException,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetPayment from './mocks/get_payment.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getPayment', () => {
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

  it('TC0001 - Should get payment successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPayment.success);

    const body: GetPaymentPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .getPayment(body);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.reason).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.errorCode).toBeUndefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not get payment after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPayment.offline);

    const body: GetPaymentPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPayment(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not get payment that no exists', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPayment.notFound);

    const body: GetPaymentPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .getPayment(body);

    expect(result).toBeNull();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not get payment after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPayment.unexpectedError);

    const body: GetPaymentPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPayment(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0005 - Should not get payment after launch situation not found', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetPayment.invalidLaunchSituation,
    );

    const body: GetPaymentPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPayment(body);

    await expect(testScript).rejects.toThrow(JdpiLaunchSituationException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
