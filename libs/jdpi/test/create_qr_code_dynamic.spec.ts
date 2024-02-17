import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PixAgentMod } from '@zro/pix-payments/domain';
import {
  PixPaymentPspException,
  CreateQrCodeDynamicPixPaymentPspRequest,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreateQrCodeDynamic from './mocks/create_qr_code_dynamic.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createQrCodeStatic', () => {
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

  it('TC0001 - Should send create createQrCodeDynamic successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreateQrCodeDynamic.success);

    const body: CreateQrCodeDynamicPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      txId: faker.name.firstName(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.datatype.string(),
      qrCodeDynamicId: faker.datatype.uuid(),
      payerCity: faker.address.cityName(),
      payerPersonType: faker.datatype.string(),
      payerDocument: faker.datatype.number(99999999999).toString(),
      payerName: faker.name.fullName(),
      payerEmail: faker.internet.email(),
      payerPhone: faker.phone.number(),
      payerAddress: faker.address.streetAddress(),
      receivableAfterDueDate: faker.datatype.datetime(),
      interestDate: faker.datatype.datetime(),
      dailyInterestValue: faker.datatype.number({ min: 1, max: 9999 }),
      fineDate: faker.datatype.datetime(),
      fineValue: faker.datatype.number({ min: 1, max: 9999 }),
      discountMaxDate: faker.datatype.datetime(),
      discountValue: faker.datatype.number({ min: 1, max: 9999 }),
      payerRequest: faker.name.fullName(),
      valueModifiable: false,
      expirationDate: faker.datatype.datetime(),
      withValue: faker.datatype.number({ min: 1, max: 9999 }),
      allowUpdateWithdrawal: false,
      agentIspbWithdrawal: faker.datatype.string(),
      agentModWithdrawal: PixAgentMod.AGPSS,
      changeValue: faker.datatype.number({ min: 1, max: 9999 }),
      allowUpdateChange: false,
      agentIspbChange: faker.datatype.string(),
      agentModChange: PixAgentMod.AGPSS,
    };

    const result = await pixService
      .getPixPaymentGateway()
      .createQrCodeDynamic(body);

    expect(result).toBeDefined();
    expect(result.emv).toBeDefined();
    expect(result.paymentLinkUrl).toBeDefined();
    expect(result.payloadJws).toBeDefined();
    expect(result.externalId).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createQrCodeDynamic after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreateQrCodeDynamic.offline);

    const body: CreateQrCodeDynamicPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      txId: faker.name.firstName(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.datatype.string(),
      qrCodeDynamicId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createQrCodeDynamic(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createQrCodeDynamic after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreateQrCodeDynamic.unexpectedError,
    );

    const body: CreateQrCodeDynamicPixPaymentPspRequest = {
      key: faker.datatype.uuid(),
      txId: faker.name.firstName(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.datatype.string(),
      qrCodeDynamicId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createQrCodeDynamic(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
