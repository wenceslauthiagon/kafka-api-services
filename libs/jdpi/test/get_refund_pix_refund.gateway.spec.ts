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
  GetPixRefundPspRequest,
} from '@zro/pix-payments/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetAllPixRefund from './mocks/get_all_pix_refund.mock';
import { PixRefundStatus } from '@zro/pix-payments/domain';

const mockAxios: any = axios;

jest.mock('axios');
mockAxios.create.mockImplementation(() => mockAxios);

describe('JdpiGetPixRefundPspGateway', () => {
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
    configService = module.get(ConfigService<JdpiGatewayConfig>);

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

  it('TC0001 - Should get all refund requests successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetAllPixRefund.success);

    const request: GetPixRefundPspRequest = {
      status: PixRefundStatus.OPEN,
    };

    const result = await pixService
      .getPixRefundGateway()
      .getRefundRequest(request);

    expect(result).toBeDefined();
    expect(result).toBeDefined();
    expect(mockAxios.get).toHaveBeenCalledTimes(2);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should throw OfflinePixPaymentPspException after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetAllPixRefund.offline);

    const request: GetPixRefundPspRequest = {
      status: PixRefundStatus.OPEN,
    };

    const testScript = () =>
      pixService.getPixRefundGateway().getRefundRequest(request);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should throw PixPaymentPspException after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetAllPixRefund.unexpectedError,
    );

    const request: GetPixRefundPspRequest = {
      status: PixRefundStatus.OPEN,
    };

    const testScript = () =>
      pixService.getPixRefundGateway().getRefundRequest(request);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
