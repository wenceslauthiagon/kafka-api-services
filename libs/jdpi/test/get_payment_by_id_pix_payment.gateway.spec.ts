import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  GetPaymentByIdPixPaymentPspRequest,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetPaymentById from './mocks/get_payment_by_id.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getPaymentByIdById', () => {
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
    mockAxios.get.mockImplementationOnce(MockJdpiGetPaymentById.success);

    const body: GetPaymentByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      externalId: faker.datatype.string(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .getPaymentById(body);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.reason).toBeUndefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.errorCode).toBeUndefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not get payment after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPaymentById.offline);

    const body: GetPaymentByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      externalId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPaymentById(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not get payment after not found error.', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetPaymentById.notFound);

    const body: GetPaymentByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      externalId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPaymentById(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not get payment after unexpected error response.', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetPaymentById.unexpectedError,
    );

    const body: GetPaymentByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
      externalId: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().getPaymentById(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });
});
