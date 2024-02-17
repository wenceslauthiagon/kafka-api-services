import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PixDevolutionCode } from '@zro/pix-payments/domain';
import {
  OfflinePixPaymentPspException,
  CreatePixDevolutionPixPaymentPspRequest,
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
import * as MockJdpiCreatePixDevolution from './mocks/create_pix_devolution.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createPixDevolution', () => {
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

  it('TC0001 - Should send createPixDevolution successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixDevolution.success);

    const body: CreatePixDevolutionPixPaymentPspRequest = {
      devolutionId: faker.datatype.uuid(),
      depositId: faker.datatype.uuid(),
      depositEndToEndId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      devolutionCode: PixDevolutionCode.ORIGINAL,
    };

    const result = await pixService
      .getPixPaymentGateway()
      .createPixDevolution(body);

    expect(result).toBeDefined();
    expect(result.externalId).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createPixDevolution after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixDevolution.offline);

    const body: CreatePixDevolutionPixPaymentPspRequest = {
      devolutionId: faker.datatype.uuid(),
      depositId: faker.datatype.uuid(),
      depositEndToEndId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      devolutionCode: PixDevolutionCode.ORIGINAL,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPixDevolution(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createPixDevolution after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePixDevolution.unexpectedError,
    );

    const body: CreatePixDevolutionPixPaymentPspRequest = {
      devolutionId: faker.datatype.uuid(),
      depositId: faker.datatype.uuid(),
      depositEndToEndId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      devolutionCode: PixDevolutionCode.ORIGINAL,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPixDevolution(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
