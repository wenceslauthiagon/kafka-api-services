import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ZroBankAuthGateway,
  ZroBankAuthGatewayConfig,
  ZroBankGatewayConfig,
  ZroBankPixService,
  ZroBankPixModule,
} from '@zro/zrobank';
import { GetQrCodeByIdPixPaymentPspRequest } from '@zro/pix-zro-pay/application';
import * as MockZroBankCreateQrCodePixPayment from '@zro/test/zrobank/mocks/create_qr_code_pix_payment_zro_bank.mock';
import * as MockZroBankAuthentication from '@zro/test/zrobank/mocks/auth.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('CreateQrCodePixPayment - Zro Bank', () => {
  let module: TestingModule;
  let createQrCodePixPayment: ZroBankPixService;
  let configService: ConfigService<ZroBankGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
        ZroBankPixModule,
      ],
    }).compile();

    createQrCodePixPayment = module.get(ZroBankPixService);
    configService = module.get(ConfigService);

    const authConfig: ZroBankAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_ZROBANK_API_PAAS_BASE_URL'),
      apiId: configService.get<string>('APP_ZROBANK_API_PAAS_ID'),
      apiKey: configService.get<string>('APP_ZROBANK_API_PAAS_KEY'),
    };
    ZroBankAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    ZroBankAuthGateway.clearTokens();
    mockAxios.post.mockImplementationOnce(MockZroBankAuthentication.oAuthToken);
  });

  it('TC0001 - Should get Qr Code with valid data', async () => {
    mockAxios.get.mockImplementationOnce(
      MockZroBankCreateQrCodePixPayment.success,
    );

    const body: GetQrCodeByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
    };

    const result = await createQrCodePixPayment
      .getGateway()
      .getQrCodeById(body);

    expect(result).toBeDefined();
    expect(result.emv).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.expirationDate).toBeDefined();
  });

  it('TC0002 - Should throw error when QR Code getting fails', async () => {
    mockAxios.post.mockImplementation(() => {
      throw new Error();
    });

    const body: GetQrCodeByIdPixPaymentPspRequest = {
      id: faker.datatype.uuid(),
    };

    const result = createQrCodePixPayment.getGateway().getQrCodeById(body);

    await expect(result).rejects.toThrow();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
