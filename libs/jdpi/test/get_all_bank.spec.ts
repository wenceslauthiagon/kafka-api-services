import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JdpiBankModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiBankService,
} from '@zro/jdpi';
import {
  BankPspException,
  OfflineBankPspException,
} from '@zro/banking/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockGetAllBank from './mocks/get_all_bank.mock';

const mockAxios: any = axios;

jest.mock('axios');
mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway GetAllBank', () => {
  let module: TestingModule;
  let bankingService: JdpiBankService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiBankModule,
      ],
    }).compile();

    bankingService = module.get(JdpiBankService);
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
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should send getAllBank successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockGetAllBank.success);

    const result = await bankingService.getBankGateway().getAllBank();

    expect(result).toBeDefined();
    expect(result).toBeDefined();
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should send getAllBank after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockGetAllBank.offline);

    const testScript = () => bankingService.getBankGateway().getAllBank();

    await expect(testScript).rejects.toThrow(OfflineBankPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should send getAllBank after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(MockGetAllBank.unexpectedError);

    const testScript = () => bankingService.getBankGateway().getAllBank();

    await expect(testScript).rejects.toThrow(BankPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
