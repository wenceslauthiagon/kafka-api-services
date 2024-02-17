import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CloseInfractionPixInfractionPspRequest,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCloseInfraction from './mocks/close_infraction.mock';
import { PixInfractionAnalysisResultType } from '@zro/pix-payments/domain';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway closeInfraction', () => {
  let module: TestingModule;
  let pixKeyService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixKeyService = module.get(JdpiPixService);
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
    mockAxios.post.mockReset();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should send close infraction successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCloseInfraction.success);

    const body: CloseInfractionPixInfractionPspRequest = {
      infractionId: uuidV4(),
      analysisResult: PixInfractionAnalysisResultType.AGREED,
    };

    const result = await pixKeyService
      .getPixInfractionGateway()
      .closeInfraction(body);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('infractionId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('operationTransactionEndToEndId');
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send close infraction after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCloseInfraction.offline);

    const body: CloseInfractionPixInfractionPspRequest = {
      infractionId: uuidV4(),
      analysisResult: PixInfractionAnalysisResultType.AGREED,
    };

    const testScript = () =>
      pixKeyService.getPixInfractionGateway().closeInfraction(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send close infraction after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCloseInfraction.unexpectedError,
    );

    const body: CloseInfractionPixInfractionPspRequest = {
      infractionId: uuidV4(),
      analysisResult: PixInfractionAnalysisResultType.AGREED,
    };

    const testScript = () =>
      pixKeyService.getPixInfractionGateway().closeInfraction(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
