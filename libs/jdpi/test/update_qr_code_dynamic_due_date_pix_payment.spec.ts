import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  PixPaymentPspException,
  UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
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
import * as MockJdpiUpdateQrCodeDynamicDueDate from './mocks/update_qr_code_dynamic_due_date_pix_payment.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway updateQrCodeDynamicDueDate', () => {
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

  it('TC0001 - Should update QrCodeDynamic (Due Date) successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiUpdateQrCodeDynamicDueDate.success,
    );

    const body: UpdateQrCodeDynamicDueDatePixPaymentPspRequest = {
      externalId: faker.datatype.uuid(),
      originalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
      rebateValue: faker.datatype.number({ min: 1, max: 99 }),
      discountValue: faker.datatype.number({ min: 1, max: 99 }),
      interestValue: faker.datatype.number({ min: 1, max: 999 }),
      fineValue: faker.datatype.number({ min: 1, max: 9999 }),
      finalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
    };

    const result = await pixService
      .getPixPaymentGateway()
      .updateQrCodeDynamicDueDate(body);

    expect(result).toBeDefined();
    expect(result.payloadJws).toBeDefined();
    expect(mockAxios.post).toBeCalledTimes(2);
  });

  it('TC0002 - Should send updateQrCodeDynamic (Due Date) after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiUpdateQrCodeDynamicDueDate.offline,
    );

    const body: UpdateQrCodeDynamicDueDatePixPaymentPspRequest = {
      externalId: faker.datatype.uuid(),
      originalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
      rebateValue: faker.datatype.number({ min: 1, max: 99 }),
      discountValue: faker.datatype.number({ min: 1, max: 99 }),
      interestValue: faker.datatype.number({ min: 1, max: 999 }),
      fineValue: faker.datatype.number({ min: 1, max: 9999 }),
      finalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().updateQrCodeDynamicDueDate(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toBeCalledTimes(2);
  });

  it('TC0003 - Should send updateQrCodeDynamic (Due Date) after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiUpdateQrCodeDynamicDueDate.unexpectedError,
    );

    const body: UpdateQrCodeDynamicDueDatePixPaymentPspRequest = {
      externalId: faker.datatype.uuid(),
      originalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
      rebateValue: faker.datatype.number({ min: 1, max: 99 }),
      discountValue: faker.datatype.number({ min: 1, max: 99 }),
      interestValue: faker.datatype.number({ min: 1, max: 999 }),
      fineValue: faker.datatype.number({ min: 1, max: 9999 }),
      finalDocumentValue: faker.datatype.number({ min: 1, max: 99999 }),
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().updateQrCodeDynamicDueDate(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toBeCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
