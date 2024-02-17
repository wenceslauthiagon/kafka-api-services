import { faker } from '@faker-js/faker/locale/pt_BR';
import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResultType } from '@zro/api-jdpi/domain';
import {
  VerifyNotifyCreditPixStatementPspRequest,
  OfflinePixStatementException,
  PixStatementException,
} from '@zro/api-jdpi/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiVerifyNotifyCreditPixStatement from './mocks/verify_notify_credit_pix_statement.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway verifyNotifyCreditPixStatement', () => {
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

  it('TC0001 - Should verify notify credit pix statement successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiVerifyNotifyCreditPixStatement.success,
    );

    const body: VerifyNotifyCreditPixStatementPspRequest = {
      id: faker.datatype.uuid(),
      groupId: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      resultType: ResultType.VALID,
      createdAt: new Date(),
    };

    const result = await pixPaymentService
      .getPixStatementGateway()
      .verifyNotifyCreditPixStatement(body);

    expect(result).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.createdAt).toBeDefined();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should not verify notify credit pix statement after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiVerifyNotifyCreditPixStatement.offline,
    );

    const body: VerifyNotifyCreditPixStatementPspRequest = {
      id: faker.datatype.uuid(),
      groupId: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      resultType: ResultType.VALID,
      createdAt: new Date(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixStatementGateway()
        .verifyNotifyCreditPixStatement(body);

    await expect(testScript).rejects.toThrow(OfflinePixStatementException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should not verify notify credit pix statement after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiVerifyNotifyCreditPixStatement.unexpectedError,
    );

    const body: VerifyNotifyCreditPixStatementPspRequest = {
      id: faker.datatype.uuid(),
      groupId: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      resultType: ResultType.VALID,
      createdAt: new Date(),
    };

    const testScript = () =>
      pixPaymentService
        .getPixStatementGateway()
        .verifyNotifyCreditPixStatement(body);

    await expect(testScript).rejects.toThrow(PixStatementException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
