import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GetInfractionPixInfractionPspRequest } from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiGetInfractions from './mocks/get_infractions.mock';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
} from '@zro/pix-payments/application';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway getInfractions', () => {
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

  it('TC0001 - Should get infractions successfully', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetInfractions.success);

    const body: GetInfractionPixInfractionPspRequest = {
      startCreationDate: new Date(),
      endCreationDate: new Date(),
    };

    const result = await pixPaymentService
      .getPixInfractionGateway()
      .getInfractions(body);

    expect(result).toBeDefined();
    result.forEach((infraction) => {
      expect(infraction.infractionId).toBeDefined();
      expect(infraction.infractionType).toBeDefined();
      expect(infraction.isReporter).toBeDefined();
      expect(infraction.ispb).toBeDefined();
      expect(infraction.reportDetails).toBeDefined();
      expect(infraction.analysisDetails).toBeDefined();
      expect(infraction.analysisResult).toBeDefined();
      expect(infraction.cancellationDate).toBeUndefined();
      expect(infraction.closingDate).toBeUndefined();
      expect(infraction.creationDate).toBeDefined();
      expect(infraction.creditedParticipant).toBeDefined();
      expect(infraction.debitedParticipant).toBeDefined();
      expect(infraction.endToEndId).toBeDefined();
      expect(infraction.lastChangeDate).toBeDefined();
      expect(infraction.reportedBy).toBeDefined();
      expect(infraction.status).toBeDefined();
    });

    expect(mockAxios.get).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should not receive infractions after the infraction type is not found', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetInfractions.invalidOperationType,
    );

    const body: GetInfractionPixInfractionPspRequest = {
      startCreationDate: new Date(),
      endCreationDate: new Date(),
    };

    const testScript = () =>
      pixPaymentService.getPixInfractionGateway().getInfractions(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should not get infractions after offline response', async () => {
    mockAxios.get.mockImplementationOnce(MockJdpiGetInfractions.offline);

    const body: GetInfractionPixInfractionPspRequest = {
      startCreationDate: new Date(),
      endCreationDate: new Date(),
    };

    const testScript = () =>
      pixPaymentService.getPixInfractionGateway().getInfractions(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should not get infractions after unexpected error response', async () => {
    mockAxios.get.mockImplementationOnce(
      MockJdpiGetInfractions.unexpectedError,
    );

    const body: GetInfractionPixInfractionPspRequest = {
      startCreationDate: new Date(),
      endCreationDate: new Date(),
    };

    const testScript = () =>
      pixPaymentService.getPixInfractionGateway().getInfractions(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
