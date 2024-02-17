import { v4 as uuidV4 } from 'uuid';
import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
  JdpiPixModule,
} from '@zro/jdpi';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  ClosePixRefundPspRequest,
} from '@zro/pix-payments/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiClosePixRefund from './mocks/close_pix_refund.mock';
import { generateRandomEndToEndId } from '@zro/test/jdpi/utils/generate_random_end_to_end_id.util';
import { PixRefundStatus } from '@zro/pix-payments/domain';

const mockAxios: any = axios;

jest.mock('axios');
mockAxios.create.mockImplementation(() => mockAxios);

describe('JdpiClosePixRefundPspGateway', () => {
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

  it('TC0001 - Should close refund request successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiClosePixRefund.success);

    const request: ClosePixRefundPspRequest = {
      solicitationPspId: uuidV4(),
      status: PixRefundStatus.CLOSED,
      analisysDetails: 'test',
      devolutionEndToEndId: generateRandomEndToEndId(),
      devolutionId: uuidV4(),
    };

    const result = await pixService
      .getPixRefundGateway()
      .closeRefundRequest(request);

    expect(result).toBeDefined();
    expect(result.solicitationPspId).toBeDefined();
    expect(result.status).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should throw OfflinePixPaymentPspException after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiClosePixRefund.offline);

    const request: ClosePixRefundPspRequest = {
      solicitationPspId: uuidV4(),
      status: PixRefundStatus.CLOSED,
      analisysDetails: 'test',
      devolutionEndToEndId: generateRandomEndToEndId(),
      devolutionId: uuidV4(),
    };

    const testScript = () =>
      pixService.getPixRefundGateway().closeRefundRequest(request);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should throw PixPaymentPspException after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiClosePixRefund.unexpectedError,
    );

    const request: ClosePixRefundPspRequest = {
      solicitationPspId: uuidV4(),
      status: PixRefundStatus.CLOSED,
      analisysDetails: 'test',
      devolutionEndToEndId: generateRandomEndToEndId(),
      devolutionId: uuidV4(),
    };

    const testScript = () =>
      pixService.getPixRefundGateway().closeRefundRequest(request);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
