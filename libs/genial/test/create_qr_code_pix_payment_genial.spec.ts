import axios from 'axios';
import { cpf } from 'cpf-cnpj-validator';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  GenialAuthGateway,
  GenialAuthGatewayConfig,
  GenialGatewayConfig,
  GenialPixService,
  GenialPixModule,
} from '@zro/genial';
import { CreateQrCodePixPaymentPspRequest } from '@zro/pix-zro-pay/application';
import { BankAccountEntity, CompanyEntity } from '@zro/pix-zro-pay/domain';
import * as MockGenialCreateQrCodePixPayment from '@zro/test/genial/mocks/create_qr_code_pix_payment_genial.mock';
import * as MockGenialAuthentication from '@zro/test/genial/mocks/auth.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('CreateQrCodePixPayment - Genial', () => {
  let module: TestingModule;
  let createQrCodePixPayment: GenialPixService;
  let configService: ConfigService<GenialGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
        GenialPixModule,
      ],
    }).compile();

    createQrCodePixPayment = module.get(GenialPixService);
    configService = module.get(ConfigService);

    const authConfig: GenialAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_GENIAL_PIX_PAYMENT_BASE_URL'),
      basicAuthorization: configService.get<string>('APP_GENIAL_AUTH_TOKEN'),
    };
    GenialAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    GenialAuthGateway.clearTokens();
    mockAxios.post.mockImplementationOnce(MockGenialAuthentication.oAuthToken);
  });

  it('TC0001 - Should create Qr Code with valid data', async () => {
    mockAxios.post.mockImplementationOnce(
      MockGenialCreateQrCodePixPayment.success,
    );

    const body: CreateQrCodePixPaymentPspRequest = {
      expirationSeconds: faker.datatype.number(),
      bankAccount: new BankAccountEntity({
        pixKey: faker.datatype.string(),
        pixKeyType: faker.datatype.string(),
        agency: faker.datatype.string(),
        accountNumber: faker.datatype.string(),
      }),
      description: faker.datatype.string(),
      value: faker.datatype.number(),
      daysAfterVenc: faker.datatype.number({ min: 1, max: 10 }),
      finePercentual: faker.datatype.number({ min: 1, max: 10 }),
      modalityChange: faker.datatype.number(),
      company: new CompanyEntity({
        showQrCodeInfoToPayer: faker.datatype.boolean(),
      }),
      payerDocument: Number(cpf.generate()),
      payerName: faker.datatype.string(),
    };

    const result = await createQrCodePixPayment.getGateway().createQrCode(body);

    expect(result).toBeDefined();
    expect(result.emv).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.expirationDate).toBeDefined();
  });

  it('TC0002 - Should throw error when QR Code creating fails', async () => {
    mockAxios.post.mockImplementation(() => {
      throw new Error();
    });

    const body: CreateQrCodePixPaymentPspRequest = {
      expirationSeconds: faker.datatype.number(),
      bankAccount: new BankAccountEntity({
        pixKey: faker.datatype.string(),
      }),
      description: faker.datatype.string(),
      value: faker.datatype.number(),
    };

    const result = createQrCodePixPayment.getGateway().createQrCode(body);

    await expect(result).rejects.toThrow();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
